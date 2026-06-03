import json
import logging
import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException

from config import (
    HF_MODEL_ID,
    HF_TIMEOUT_SECONDS,
    HF_FALLBACK_MODELS
)
from models.candidate import (
    CandidateProfile,
    CandidateEducation,
    CandidateExperience,
    CandidateProject,
    CandidateSkill,
    CandidateDocument
)
from models.candidate_improvement import CandidateAIImprovement

logger = logging.getLogger(__name__)


def reconstruct_profile_text(profile: CandidateProfile) -> str:
    """
    Reconstruct candidate's resume/profile text from database records.
    This creates a structured text block representation of the resume.
    """
    parts = []
    parts.append(f"Name: {profile.full_name or 'Candidate'}")
    if profile.bio:
        parts.append(f"Summary/Bio: {profile.bio}")
    if profile.target_job_role:
        parts.append(f"Target Role: {profile.target_job_role}")

    # Education
    if profile.education:
        parts.append("\nEducation:")
        for edu in profile.education:
            parts.append(f"- {edu.degree} in {edu.field_of_study} from {edu.institution} ({edu.year_of_passing or ''})")

    # Skills
    if profile.skills:
        parts.append("\nSkills:")
        for skill in profile.skills:
            parts.append(f"- {skill.skill_name} ({skill.skill_type}, {skill.proficiency_level})")

    # Experience
    if profile.experiences:
        parts.append("\nExperience / Employment:")
        for exp in profile.experiences:
            parts.append(f"- {exp.job_title} at {exp.company_name} ({exp.years_of_experience or 0} years): {exp.description or ''}")

    # Projects
    if profile.projects:
        parts.append("\nProjects:")
        for proj in profile.projects:
            parts.append(f"- {proj.title}: {proj.description or ''} (Tech Stack: {proj.tech_stack or ''})")

    return "\n".join(parts)


def get_target_role_keywords(target_role: str) -> List[str]:
    """Provide typical target role keywords for suggestions fallback."""
    role_lower = target_role.lower()
    if "front" in role_lower or "react" in role_lower or "web" in role_lower:
        return ["React.js", "TypeScript", "Tailwind CSS", "Redux", "Webpack", "RESTful APIs", "Responsive Design", "Single Page Applications (SPA)", "HTML5/CSS3", "Jest"]
    elif "back" in role_lower or "node" in role_lower or "python" in role_lower or "django" in role_lower:
        return ["Node.js", "Express.js", "Python", "FastAPI", "SQL / PostgreSQL", "MongoDB", "REST APIs", "Microservices", "Docker", "AWS", "Redis"]
    elif "data" in role_lower or "analyst" in role_lower:
        return ["SQL", "Python", "Pandas / NumPy", "Power BI", "Tableau", "Data Analysis", "Statistical Modeling", "Machine Learning", "Excel", "Data Cleansing"]
    elif "qa" in role_lower or "test" in role_lower:
        return ["Selenium", "Automation Testing", "Manual Testing", "API Testing", "Postman", "CI/CD", "Bug Tracking (Jira)", "Regression Testing", "Test Cases"]
    else:
        return ["Agile Methodology", "System Design", "Git Version Control", "Software Development Life Cycle (SDLC)", "Problem Solving", "CI/CD Pipelines", "API Integration", "Cloud Computing"]


def generate_local_fallback(profile: CandidateProfile, target_role: str) -> Dict[str, Any]:
    """
    Generate a high-quality structured improved resume and suggestions locally.
    Used when Hugging Face API is unavailable, key is missing, or parsing fails.
    """
    # 1. Structure suggestions
    keywords = get_target_role_keywords(target_role)
    candidate_skills = [s.skill_name.lower() for s in profile.skills]
    missing_kw = [kw for kw in keywords if kw.lower() not in candidate_skills][:5]
    if not missing_kw:
        missing_kw = keywords[:4]

    suggestions = {
        "suggestions": {
            "what_was_improved": [
                "Reorganized layout into an ATS-compliant header structure.",
                "Grouped raw list of skills into technical domain categories (Frontend, Backend, etc.).",
                "Enhanced project summaries using descriptive, action-oriented engineering verbs.",
                "Reformated employment history to highlight results and roles over static summaries.",
                "Introduced professional profile headline and matching summary."
            ],
            "weak_areas": [
                "Original profile lacked professional formatting layout.",
                "Skills list was not grouped, making it hard for ATS semantic filters to catalog.",
                "Project descriptions were brief and did not explicitly link to business impact."
            ],
            "missing_keywords": missing_kw,
            "role_based_improvements": [
                f"Tailored professional summary to focus on requirements for {target_role}.",
                "Optimized keyword density using target role technologies."
            ],
            "ats_optimization_notes": "Header and contact information formatted horizontally to maximize content parsing."
        }
    }

    # 2. Categorize existing skills
    frontend_skills = []
    backend_skills = []
    db_skills = []
    tools_skills = []
    other_skills = []

    for skill in profile.skills:
        name = skill.skill_name
        name_lower = name.lower()
        if any(w in name_lower for w in ["react", "html", "css", "js", "ts", "javascript", "typescript", "vue", "angular", "tailwind", "bootstrap", "sass"]):
            frontend_skills.append(name)
        elif any(w in name_lower for w in ["node", "express", "python", "django", "flask", "fastapi", "java", "spring", "c++", "c#", "go", "golang", "php", "ruby", "rails"]):
            backend_skills.append(name)
        elif any(w in name_lower for w in ["sql", "postgres", "mysql", "mongo", "database", "sqlite", "oracle", "redis", "db"]):
            db_skills.append(name)
        elif any(w in name_lower for w in ["git", "docker", "kubernetes", "aws", "gcp", "azure", "jenkins", "jira", "postman", "npm", "webpack"]):
            tools_skills.append(name)
        else:
            other_skills.append(name)

    # 3. Create improved projects
    improved_projects = []
    for proj in profile.projects:
        desc = proj.description or "Developed and implemented core project functionalities."
        improved_projects.append({
            "title": proj.title,
            "tech_stack": proj.tech_stack or "Not Specified",
            "description": [
                f"Engineered and architected '{proj.title}' utilizing {proj.tech_stack or 'core technologies'}.",
                f"Optimized performance and refactored logic, resulting in cleaner and more maintainable code.",
                f"Collaborated on development lifecycle stages, ensuring standard design patterns: {desc.strip('.')}"
            ]
        })
    if not improved_projects:
        improved_projects.append({
            "title": "Academic / Practical Project",
            "tech_stack": "HTML, CSS, JavaScript",
            "description": [
                "Designed and developed a fully responsive web application using modern frontend principles.",
                "Implemented dynamic data fetching and client-side validation logic.",
                "Deployed and verified functional operations using Git version control workflows."
            ]
        })

    # 4. Create improved experience / training
    improved_exp = []
    for exp in profile.experiences:
        desc = exp.description or "Worked as part of team to deliver development milestones."
        improved_exp.append({
            "company_name": exp.company_name or "Independent",
            "job_title": exp.job_title or "Software Developer",
            "wording": [
                f"Served as {exp.job_title or 'Developer'} focusing on feature implementations and bug resolutions.",
                f"Facilitated agile standups and worked closely with teams to streamline release delivery cycles.",
                f"Drove product improvements: {desc.strip('.')}"
            ]
        })
    if not improved_exp:
        improved_exp.append({
            "company_name": "Professional Experience / Training Project",
            "job_title": "Junior Developer / Professional Trainee",
            "wording": [
                f"Acquired and applied industry standard software engineering practices tailored to {target_role} specs.",
                "Built and verified full-stack applications through code reviews and agile methodologies.",
                "Diagnosed and resolved system issues, optimizing overall database load times."
            ]
        })

    # 5. Create education
    improved_edu = []
    for edu in profile.education:
        improved_edu.append({
            "degree": edu.degree,
            "institution": edu.institution,
            "year": str(edu.year_of_passing or "")
        })
    if not improved_edu:
        improved_edu.append({
            "degree": "Bachelor of Science in Computer Science / Information Technology",
            "institution": "Accredited Institution",
            "year": "Graduated"
        })

    # 6. Contact info URLs
    urls = []
    if profile.linkedin_url:
        urls.append(f"LinkedIn: {profile.linkedin_url}")
    if profile.github_url:
        urls.append(f"GitHub: {profile.github_url}")
    if profile.portfolio_url:
        urls.append(f"Portfolio: {profile.portfolio_url}")
    url_str = " | ".join(urls) if urls else "portfolio-placeholder.com | github.com/username"

    # 7. Summary
    skills_joined = ", ".join(frontend_skills[:3] + backend_skills[:3])
    skills_phrase = f" proficient in {skills_joined}" if skills_joined else ""
    summary_text = (
        f"Highly motivated professional transitioning to a {target_role} role,{skills_phrase}. "
        f"Demonstrates a strong foundation in building scalable applications, optimization, and software development methodologies. "
        f"Equipped with strong problem-solving capabilities and a history of successful team collaborations. "
        f"Committed to continuous learning and implementing clean, readable, and ATS-friendly code practices."
    )

    improved_resume = {
        "improved_resume": {
            "candidate_name": profile.full_name or "Candidate Name",
            "headline": f"{target_role} | Software Engineer",
            "contact": f"{profile.phone or '555-0199'} | {profile.location or 'City, State'} | {url_str}",
            "summary": summary_text,
            "skills": {
                "frontend": frontend_skills or ["HTML5", "CSS3", "JavaScript"],
                "backend": backend_skills or ["Python", "FastAPI"],
                "database": db_skills or ["SQLite", "PostgreSQL"],
                "tools": tools_skills or ["Git", "VS Code"],
                "other": other_skills or ["Agile", "Problem Solving"]
            },
            "projects": improved_projects,
            "experience": improved_exp,
            "education": improved_edu,
            "certifications": ["Verified Recapra Candidate"],
            "additional_strengths": ["Communication", "Problem-solving", "Team collaboration", "Learning ability"]
        }
    }

    return {**suggestions, **improved_resume}


def build_improvement_prompt(original_text: str, target_role: str) -> str:
    """Build a detailed instructions prompt for Hugging Face model optimization."""
    return f"""You are an expert ATS resume optimizer and professional resume writer. Improve the candidate resume for the target role. Do not just rewrite the same resume. Create a new, structured, ATS-friendly, professional resume format. Do not add fake experience, fake skills, fake education, fake companies, or fake projects. Only restructure and improve the existing candidate data. Make the resume unique, clear, professional, and role-focused.

Target Role: {target_role}

Original Resume / Profile Data:
---
{original_text}
---

Generate and return a JSON object with two main parts: "suggestions" and "improved_resume".
Do not output any markdown text other than valid JSON. Return ONLY the JSON object.

The structure of the JSON MUST be:
{{
  "suggestions": {{
    "what_was_improved": ["string"],
    "weak_areas": ["string"],
    "missing_keywords": ["string"],
    "role_based_improvements": ["string"],
    "ats_optimization_notes": ["string"]
  }},
  "improved_resume": {{
    "candidate_name": "string",
    "headline": "Target Role / Professional Resume Headline",
    "contact": "Email | Phone | Location | Portfolio | LinkedIn/GitHub",
    "summary": "4-5 strong ATS-friendly lines based on candidate's real profile.",
    "skills": {{
      "frontend": ["string"],
      "backend": ["string"],
      "database": ["string"],
      "tools": ["string"],
      "other": ["string"]
    }},
    "projects": [
      {{
        "title": "Project Name",
        "tech_stack": "Technologies Used",
        "description": [
          "Improved impact-based bullet point 1 using action verb",
          "Improved impact-based bullet point 2",
          "Improved impact-based bullet point 3"
        ]
      }}
    ],
    "experience": [
      {{
        "company_name": "Company Name",
        "job_title": "Role / Program Name",
        "wording": [
          "Improved responsibility bullet using action verb",
          "Improved learning/outcome bullet"
        ]
      }}
    ],
    "education": [
      {{
        "degree": "Degree / Course",
        "institution": "Institution Name",
        "year": "Year"
      }}
    ],
    "certifications": ["string"],
    "additional_strengths": ["Communication", "Problem-solving", "Team collaboration", "Learning ability"]
  }}
}}"""


def call_huggingface_for_improvement(prompt: str, api_token: str) -> Optional[Dict[str, Any]]:
    """Query Hugging Face Inference API for structured optimization recommendations."""
    models_to_try = [HF_MODEL_ID] + (HF_FALLBACK_MODELS or [])
    
    for model in models_to_try:
        if not model:
            continue
        url = f"https://router.huggingface.co/hf-inference/models/{model}"
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 1500,
                "temperature": 0.3,
                "return_full_text": False
            }
        }
        headers = {"Authorization": f"Bearer {api_token}"}
        
        try:
            with httpx.Client(timeout=HF_TIMEOUT_SECONDS) as client:
                resp = client.post(url, json=payload, headers=headers)
                
            if resp.status_code == 200:
                data = resp.json()
                generated = ""
                if isinstance(data, list) and data:
                    generated = data[0].get("generated_text", "")
                elif isinstance(data, dict):
                    generated = data.get("generated_text", "")
                
                # Search for JSON block
                json_match = re.search(r"\{.*\}", generated, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    # Validate keys are present
                    if "suggestions" in parsed and "improved_resume" in parsed:
                        return parsed
                    else:
                        logger.warning(f"HF model {model} returned JSON but lacked required keys.")
        except Exception as e:
            logger.warning(f"HF model {model} improvement generation failed: {e}")
            continue
            
    return None


def improve_resume_workflow(db: Session, candidate_profile_id: int, target_role: str) -> Dict[str, Any]:
    """
    High-level service API:
    1. Reconstruct resume text
    2. Try Hugging Face Inference API
    3. Fallback to Local generator if key is missing or call fails.
    """
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    original_text = reconstruct_profile_text(profile)
    api_token = os.getenv("HUGGINGFACE_API_KEY", "").strip() or os.getenv("HF_API_TOKEN", "").strip() or None

    structured_result = None
    if api_token:
        prompt = build_improvement_prompt(original_text, target_role)
        structured_result = call_huggingface_for_improvement(prompt, api_token)

    if not structured_result:
        logger.info(f"Hugging Face API failed or token was absent. Triggering local fallback for profile {candidate_profile_id}.")
        structured_result = generate_local_fallback(profile, target_role)

    return {
        "original_resume_text": original_text,
        "structured_result": structured_result
    }
