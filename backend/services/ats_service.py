"""
ats_service.py — ATS Analysis Service (Recapra Phase 2)

Supports two scoring modes:
  1. n8n AI workflow  — used when N8N_WEBHOOK_URL is set in .env
  2. In-house engine  — built-in fallback when n8n is absent or fails

The choice is made per-applicant. If n8n fails for one applicant, in-house
scoring continues for the rest — ensuring partial results are always saved.
"""

import json
import re
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.ats import ATSResult
from models.job import Job
from models.application import JobApplication
from models.candidate import (
    CandidateProfile, CandidateSkill, CandidateExperience,
    CandidateEducation, CandidateProject, CandidateDocument
)
from services.notification_service import create_notification

logger = logging.getLogger(__name__)

# ─── Configuration ───────────────────────────────────────────────────────────

from config import (
    HF_API_TOKEN, HF_MODEL_ID, HF_TIMEOUT_SECONDS,
    HF_API_URL, HF_FALLBACK_MODELS
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_job_isolation(db: Session, job_id: int, company_id: int) -> Job:
    """Ensure company owns the job before proceeding."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found."
        )
    if job.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this job opening."
        )
    return job


COMMON_SHORT_TECHS = {
    "aws", "sql", "git", "go", "c", "c++", "c#", "js", "ts", "css", "api", "php",
    "xml", "npm", "yml", "tla", "ios", "nlp", "gcp", "ssh", "ssl", "ui", "ux", "r"
}

STOPWORDS = {
    "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot",
    "could", "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each",
    "few", "for", "from", "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed",
    "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i",
    "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more",
    "most", "mustnt", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant", "she", "shed", "shell", "shes",
    "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their", "theirs", "them",
    "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well",
    "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who",
    "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre",
    "youve", "your", "yours", "yourself", "yourselves", "will", "shall", "should", "would", "could", "years",
    "experience", "using", "work", "team", "development", "developer", "working", "building", "project",
    "skills", "knowledge", "required", "preferred"
}

def extract_clean_keywords(text: str) -> List[str]:
    """Extract clean keywords from text, preserving tech terms like c++, c#, .net, node.js, react.js."""
    if not text:
        return []
    text = text.lower()
    raw_tokens = re.findall(r'[a-z0-9+#\.\-]+', text)
    keywords = []
    for token in raw_tokens:
        t = token.strip(".,- ")
        if token == ".net":
            t = ".net"
        if not t or t.isdigit():
            continue
        if t in STOPWORDS:
            continue
        if t in COMMON_SHORT_TECHS:
            keywords.append(t)
        elif len(t) >= 3:
            keywords.append(t)
    return list(set(keywords))

def extract_keywords(text: str) -> List[str]:
    """Fallback / Compatibility wrapper for legacy codebase calls."""
    return extract_clean_keywords(text)

def parse_skills_list(skills_field: Any) -> List[str]:
    """Helper to parse list or string of skills into unique trimmed lowercase skills."""
    if not skills_field:
        return []
    if isinstance(skills_field, list):
        return list(set(s.strip().lower() for s in skills_field if s and s.strip()))
    if isinstance(skills_field, str):
        try:
            parsed = json.loads(skills_field)
            if isinstance(parsed, list):
                return list(set(s.strip().lower() for s in parsed if s and s.strip()))
        except Exception:
            pass
        return list(set(s.strip().lower() for s in skills_field.split(",") if s and s.strip()))
    return []

def parse_overall_score(value: Any) -> Optional[int]:
    """
    Parse score values from n8n.
    Supports int, float, "82", "82%", "82 / 100", "Score: 82".
    Returns integer clamped between 0 and 100, or None if invalid.
    """
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return max(0, min(100, int(value)))

    if isinstance(value, str):
        value_clean = value.strip()
        if not value_clean:
            return None

        try:
            return max(0, min(100, int(float(value_clean))))
        except ValueError:
            pass

        match = re.search(r"\d+(?:\.\d+)?", value_clean)
        if match:
            try:
                score = int(float(match.group()))
                return max(0, min(100, score))
            except ValueError:
                pass

    return None

def parse_required_experience(exp_str: str) -> int:
    """Extract years of experience required from job description string."""
    if not exp_str:
        return 0
    match = re.search(r"\d+", exp_str)
    if match:
        return int(match.group())
    return 0

def get_match_level(score: int) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Strong"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Needs Review"
    return "Weak"

def safe_list(value: Any) -> List:
    """Safely convert a value to a list."""
    if isinstance(value, list):
        return value

    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass

        return [value] if value.strip() else []

    return []

def safe_int(value: Any, default: int = 0, minimum: int = 0, maximum: int = 100) -> int:
    """Safely convert a value to an int within bounds."""
    try:
        parsed_score = parse_overall_score(value)
        if parsed_score is not None:
            return max(minimum, min(maximum, parsed_score))
        return max(minimum, min(maximum, int(value)))
    except (TypeError, ValueError):
        return default


# ─── Hugging Face Payload Builder ─────────────────────────────────────────────

def build_hf_report_payload(
    job: Job,
    application: JobApplication,
    candidate: CandidateProfile,
    prelim: Dict[str, Any]
) -> Dict[str, Any]:
    """Build the clean prepared payload to send as context to Hugging Face."""

    education_list = [
        {
            "degree": edu.degree,
            "field": edu.field_of_study,
            "institution": edu.institution,
            "year": str(edu.year_of_passing or ""),
        }
        for edu in candidate.education
    ]

    experience_list = [
        {
            "title": exp.job_title or "",
            "company": exp.company_name or "",
            "years": exp.years_of_experience or 0,
            "description": exp.description or "",
            "career_gap_reason": exp.career_gap_reason or "",
        }
        for exp in candidate.experiences
    ]

    project_list = [
        {
            "title": proj.title,
            "description": proj.description or "",
            "tech_stack": proj.tech_stack or "",
            "url": proj.project_link or proj.github_link or proj.live_demo_link or "",
        }
        for proj in candidate.projects
    ]

    resume_text = prelim.get("resume_analysis", "")
    resume_doc = next(
        (d for d in candidate.documents if d.document_type == "resume"),
        None
    )
    if resume_doc:
        resume_text += f" (Filename: {resume_doc.original_file_name})"

    jd_text = f"{job.title} {job.description} {job.requirements or ''}"
    job_keywords = extract_clean_keywords(jd_text)

    cand_all_text = f"{candidate.bio or ''} {candidate.target_job_role or ''}"
    for exp in candidate.experiences:
        cand_all_text += f" {exp.job_title or ''} {exp.description or ''}"
    for proj in candidate.projects:
        cand_all_text += f" {proj.title} {proj.description or ''} {proj.tech_stack or ''}"

    candidate_keywords = extract_clean_keywords(cand_all_text)

    required_skills = parse_skills_list(job.required_skills)
    preferred_skills = parse_skills_list(getattr(job, "preferred_skills", ""))

    return {
        "job_title": job.title or "",
        "job_description": job.description or "",
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,

        "candidate_summary": {
            "name": candidate.full_name,
            "target_role": candidate.target_job_role or "",
            "career_status": candidate.career_status or "",
            "location": candidate.location or ""
        },

        "score_breakdown": {
            "overall_score": prelim.get("overall_score", 0),
            "match_level": prelim.get("match_level", ""),
            "confidence_level": prelim.get("confidence_level", ""),
            "skills_score": prelim.get("skills_score", 0),
            "experience_score": prelim.get("experience_score", 0),
            "project_score": prelim.get("project_score", 0),
            "resume_keyword_score": prelim.get("resume_keyword_score", 0),
            "cover_letter_score": prelim.get("cover_letter_score", 0),
            "education_score": prelim.get("education_score", 0)
        },

        "matched_skills": prelim.get("matched_skills", []),
        "missing_skills": prelim.get("missing_skills", []),
        "matched_keywords": prelim.get("matched_keywords", []),
        "missing_keywords": prelim.get("missing_keywords", []),

        "experience_match_indicators": prelim.get("experience_match_indicators", {}),
        "project_relevance_indicators": prelim.get("project_relevance_indicators", {}),
        "education_match_indicators": prelim.get("education_match_indicators", {}),

        "resume_analysis_base": prelim.get("resume_analysis", ""),
        "cover_letter_analysis_base": prelim.get("cover_letter_analysis", ""),
        "project_relevance_summary_base": prelim.get("project_relevance_summary", ""),

        "resume_text": resume_text,
        "cover_letter": application.cover_letter or "",
        "candidate_projects": project_list,
        "candidate_experience": experience_list,
        "candidate_education": education_list
    }


# ─── Hugging Face Prompt Constructor ──────────────────────────────────────────

def build_hf_prompt(payload: Dict[str, Any]) -> str:
    """Build the instruction prompt for Hugging Face structured JSON generation."""
    prepared_ats_payload = json.dumps(payload, indent=2)
    return f"""<s>[INST] You are an ATS report analysis generator for Recapra.

The backend already calculated ATS score, score breakdown, matched skills, missing skills, matched keywords, and missing keywords.

Do not redo scoring from scratch.
Do not invent skills, education, projects, or experience.
Use only the provided data.

Your task is to create a clean recruiter-facing ATS analysis report.

Create:
1. Summary
2. What is good
3. What is missing
4. Improvement needed
5. Trend analysis
6. Chart analysis
7. Strengths
8. Concerns
9. Recruiter recommendation
10. Feedback summary
11. Resume analysis
12. Cover letter analysis
13. Project relevance summary

Rules:
- Return only valid JSON.
- Do not return markdown.
- Do not wrap output in ```json.
- Do not add explanation outside JSON.
- Array fields must always be arrays of strings.
- Object fields must always be valid JSON objects.
- Keep report professional and company/recruiter focused.
- ATS is decision-support only. Do not auto-reject.

Return exactly this JSON structure:
{{
  "summary": "",
  "what_is_good": [],
  "what_is_missing": [],
  "improvement_needed": [],
  "trend_analysis": "",
  "chart_analysis": {{
    "overall": "",
    "skills": "",
    "experience": "",
    "projects": "",
    "resume_keywords": "",
    "cover_letter": "",
    "education": ""
  }},
  "strengths": [],
  "concerns": [],
  "recommendation": "",
  "feedback_summary": "",
  "resume_analysis": "",
  "cover_letter_analysis": "",
  "project_relevance_summary": ""
}}

Input data:
{prepared_ats_payload}
[/INST]"""


# ─── Hugging Face API Call ────────────────────────────────────────────────────

def call_huggingface_for_report(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Query Hugging Face Inference API with support for:
      - Custom API URL (HF_API_URL)
      - Primary and Fallback Models (HF_FALLBACK_MODELS)
      - Detailed Status Code Handling (401, 403, 404, 429, 503)
      - Enhanced Error Logging (not exposing secrets)
    """
    import time
    if not HF_API_TOKEN:
        logger.info("Hugging Face API call skipped: HF_API_TOKEN is empty/missing.")
        return None

    app_id = payload.get("score_breakdown", {}).get("application_id")

    # Determine models to try
    primary_model = HF_MODEL_ID or "mistralai/Mistral-7B-Instruct-v0.3"
    models_to_try = [primary_model]
    for fallback in HF_FALLBACK_MODELS:
        if fallback and fallback not in models_to_try:
            models_to_try.append(fallback)

    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # If custom API URL exists, use it directly (no fallback model looping needed)
    if HF_API_URL:
        endpoints_map = {"custom": [HF_API_URL]}
        models_to_try = [primary_model] # just for logging
    else:
        # For each model, we'll try Option A first, and Option B if Option A fails.
        endpoints_map = {}
        for m in models_to_try:
            endpoints_map[m] = [
                f"https://api-inference.huggingface.co/models/{m}",
                f"https://router.huggingface.co/hf-inference/models/{m}"
            ]

    for model in models_to_try:
        endpoints = endpoints_map.get("custom", endpoints_map.get(model, []))
        
        for endpoint in endpoints:
            endpoint_type = "custom" if HF_API_URL else ("router" if "router.huggingface.co" in endpoint else "standard")
            prompt = build_hf_prompt(payload)
            request_body = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 1200,
                    "temperature": 0.2,
                    "return_full_text": False
                },
                "options": {
                    "wait_for_model": True
                }
            }
            
            max_attempts = 2
            for attempt in range(1, max_attempts + 1):
                try:
                    logger.info("Calling HF endpoint: type=%s, model=%s, attempt=%d/%d, app_id=%s",
                                endpoint_type, model, attempt, max_attempts, app_id)
                    
                    with httpx.Client(timeout=HF_TIMEOUT_SECONDS) as client:
                        response = client.post(endpoint, json=request_body, headers=headers)
                        
                    # Explicit Status Code Handling
                    if response.status_code == 200:
                        raw_response = response.json()
                        generated_text = ""
                        if isinstance(raw_response, list) and raw_response and isinstance(raw_response[0], dict):
                            generated_text = raw_response[0].get("generated_text", "")
                        elif isinstance(raw_response, dict):
                            generated_text = response_json = raw_response.get("generated_text", "") or raw_response.get("choices", [{}])[0].get("text", "")
                            # Wait, let's keep it simple:
                            generated_text = raw_response.get("generated_text", "") or raw_response.get("choices", [{}])[0].get("text", "")
                        elif isinstance(raw_response, str):
                            generated_text = raw_response
                            
                        if not generated_text:
                            logger.warning("Hugging Face response contained empty text: model=%s, app_id=%s", model, app_id)
                            continue
                            
                        report_dict = extract_json_from_text(generated_text)
                        if report_dict:
                            return report_dict
                        else:
                            # Invalid JSON structure from model
                            logger.error("Hugging Face response could not be parsed as JSON: status=200, model=%s, app_id=%s, fallback=in_house", model, app_id)
                            return None # Fallback to in-house immediately as per instruction: "Invalid JSON: Fallback to in_house."
                            
                    elif response.status_code == 401:
                        logger.error("Hugging Face call failed: status=401, model=%s, endpoint_type=%s, reason=Unauthorized. Token may be invalid/expired, app_id=%s, fallback=in_house",
                                     model, endpoint_type, app_id)
                        return None # Fallback immediately to in-house
                        
                    elif response.status_code == 403:
                        logger.error("Hugging Face call failed: status=403, model=%s, endpoint_type=%s, reason=Forbidden. Token may lack 'Make calls to Inference Providers' scope or model requires approval, app_id=%s, fallback=in_house",
                                     model, endpoint_type, app_id)
                        return None # Fallback immediately to in-house
                        
                    elif response.status_code == 404:
                        logger.warning("Hugging Face call returned 404 Not Found: model=%s, endpoint_type=%s, app_id=%s. Trying fallback model if available.",
                                       model, endpoint_type, app_id)
                        break # Break current endpoint loop to try fallback models
                        
                    elif response.status_code == 429:
                        retry_after = response.headers.get("Retry-After")
                        if retry_after and retry_after.isdigit() and int(retry_after) <= 5:
                            delay = int(retry_after)
                            logger.warning("Hugging Face rate limited (429): retry-after=%ds. Sleeping and retrying...", delay)
                            time.sleep(delay)
                            continue # Retry same attempt
                        else:
                            logger.error("Hugging Face rate limited (429): status=429, model=%s, endpoint_type=%s, reason=Rate limit exceeded, app_id=%s, fallback=in_house",
                                         model, endpoint_type, app_id)
                            return None # Fallback to in-house
                            
                    elif response.status_code == 503:
                        # Service Unavailable/Model loading - retry once
                        logger.warning("Hugging Face returned 503 Service Unavailable (Model loading): model=%s, attempt=%d", model, attempt)
                        if attempt == max_attempts:
                            logger.error("Hugging Face call failed: status=503, model=%s, endpoint_type=%s, reason=Service Unavailable/Model loading failed, app_id=%s, fallback=in_house",
                                         model, endpoint_type, app_id)
                        time.sleep(1) # wait briefly before retry
                        
                    else:
                        logger.warning("Hugging Face returned unexpected status=%d: model=%s, attempt=%d", response.status_code, model, attempt)
                        if attempt == max_attempts:
                            logger.error("Hugging Face call failed: status=%d, model=%s, endpoint_type=%s, reason=Unexpected status code, app_id=%s, fallback=in_house",
                                         response.status_code, model, endpoint_type, app_id)
                            
                except httpx.TimeoutException as e:
                    logger.warning("Hugging Face call timed out (attempt %d/%d): model=%s, app_id=%s", attempt, max_attempts, model, app_id)
                    if attempt == max_attempts:
                        logger.error("Hugging Face call failed: status=timeout, model=%s, endpoint_type=%s, reason=Request timed out after %ds, app_id=%s, fallback=in_house",
                                     model, endpoint_type, HF_TIMEOUT_SECONDS, app_id)
                        
                except httpx.RequestError as e:
                    logger.warning("Hugging Face connection error (attempt %d/%d): endpoint_type=%s, error=%s", attempt, max_attempts, endpoint_type, str(e))
                    if endpoint_type == "standard" and "api-inference.huggingface.co" in endpoint:
                        logger.info("Standard endpoint connection failed. Retrying with router endpoint for model=%s...", model)
                        break # Break attempt loop to move to the next endpoint (Option B: router) for the same model
                    if attempt == max_attempts:
                        logger.error("Hugging Face call failed: status=connection_error, model=%s, endpoint_type=%s, reason=%s, app_id=%s, fallback=in_house",
                                     model, endpoint_type, str(e), app_id)
                        
                except Exception as e:
                    logger.error("Hugging Face unexpected error: model=%s, endpoint_type=%s, error=%s, app_id=%s, fallback=in_house",
                                 model, endpoint_type, str(e), app_id)
                    return None
                    
    # If all models and endpoints have been exhausted without success
    logger.error("Hugging Face call failed: status=exhausted, reason=All models and endpoints failed, app_id=%s, fallback=in_house", app_id)
    return None


# ─── JSON Extractor ───────────────────────────────────────────────────────────

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """Safely extract and parse JSON from Hugging Face response."""
    if not text:
        return None
        
    text_clean = text.strip()
    
    # Try direct parse
    try:
        return json.loads(text_clean)
    except json.JSONDecodeError:
        pass
        
    # Try parsing inside markdown fences
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text_clean, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Find the outer braces
    start_idx = text_clean.find('{')
    end_idx = text_clean.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_candidate = text_clean[start_idx:end_idx + 1]
        try:
            return json.loads(json_candidate)
        except json.JSONDecodeError:
            try:
                # Remove trailing commas inside arrays or objects
                cleaned = re.sub(r",\s*(\]|\})", r"\1", json_candidate)
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass
                
    return None


# ─── Hugging Face Report Normalizer ───────────────────────────────────────────

def normalize_hf_report(raw_report: Dict[str, Any], prelim: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and normalize HF report fields, falling back to Python preprocessing."""
    if not raw_report:
        raw_report = {}
        
    candidate_name = prelim.get("candidate_profile_name") or "Candidate"
    overall_score = prelim.get("overall_score", 0)
    match_level = prelim.get("match_level", "Needs Review")
    recommendation = prelim.get("recommendation") or "Review candidate suitability score profile."

    # Max scores for categories
    max_scores = {
        "Skills Match": (prelim.get("skills_score", 0), 35),
        "Experience Match": (prelim.get("experience_score", 0), 20),
        "Project Relevance": (prelim.get("project_score", 0), 15),
        "Resume Keywords": (prelim.get("resume_keyword_score", 0), 15),
        "Cover Letter": (prelim.get("cover_letter_score", 0), 10),
        "Education Match": (prelim.get("education_score", 0), 5)
    }

    # Calculate percentages for trends
    percentages = {}
    for cat, (score, max_val) in max_scores.items():
        percentages[cat] = (score / max_val) * 100 if max_val > 0 else 0

    # 1. summary
    summary = raw_report.get("summary")
    if not summary or not str(summary).strip():
        summary = f"{candidate_name} scored {overall_score}% with a {match_level} match level."
        
    # 2. what_is_good
    what_is_good = safe_list(raw_report.get("what_is_good"))
    if not what_is_good:
        good_items = []
        for cat, pct in percentages.items():
            if pct >= 70:
                good_items.append(f"Strong performance in {cat} ({max_scores[cat][0]}/{max_scores[cat][1]}).")
        prelim_strengths = safe_list(prelim.get("strengths", []))
        what_is_good = list(dict.fromkeys(prelim_strengths + good_items)) # Deduplicated
        if not what_is_good:
            what_is_good = ["Meets general baseline expectations for technical credentials."]
        
    # 3. what_is_missing
    what_is_missing = safe_list(raw_report.get("what_is_missing"))
    if not what_is_missing:
        missing_items = []
        for cat, pct in percentages.items():
            if pct < 50:
                missing_items.append(f"Low keyword matching or score in {cat} ({max_scores[cat][0]}/{max_scores[cat][1]}).")
        
        # Missing skills
        missing_skills = safe_list(prelim.get("missing_skills", []))
        skills_missing_pills = [f"{skill} is missing." for skill in missing_skills[:5]]
        
        prelim_concerns = safe_list(prelim.get("concerns", []))
        what_is_missing = list(dict.fromkeys(skills_missing_pills + prelim_concerns + missing_items))
        if not what_is_missing:
            what_is_missing = ["No major missing elements or concerns found during baseline scanning."]
        
    # 4. improvement_needed
    improvement_needed = safe_list(raw_report.get("improvement_needed"))
    if not improvement_needed:
        improvements = []
        missing_skills = safe_list(prelim.get("missing_skills", []))
        for skill in missing_skills[:3]:
            improvements.append(f"Improve evidence or certifications for {skill.title()}.")
            
        if percentages["Skills Match"] < 60:
            improvements.append("Strengthen direct match keywords inside technical resume sections.")
        if percentages["Experience Match"] < 60:
            improvements.append("Elaborate on professional history timelines or specify related tenure achievements.")
        if percentages["Project Relevance"] < 60:
            improvements.append("Add more relevant project details matching the job description.")
        if percentages["Resume Keywords"] < 60:
            improvements.append("Improve resume keywords based on the job description.")
        if percentages["Cover Letter"] < 60:
            improvements.append("Improve cover letter with role-specific examples and measurable achievements.")
            
        improvement_needed = list(dict.fromkeys(improvements))
        if not improvement_needed:
            improvement_needed = ["Maintain current skills alignment. No major improvement needed."]
            
    # 5. trend_analysis
    trend_analysis = raw_report.get("trend_analysis")
    if not trend_analysis or not str(trend_analysis).strip():
        sorted_cats = sorted(percentages.items(), key=lambda x: x[1], reverse=True)
        strongest = [name for name, pct in sorted_cats if pct >= 70][:2]
        weakest = [name for name, pct in sorted_cats if pct < 50][:2]
        
        strongest_str = " and ".join(strongest) if strongest else "general profile baselines"
        weakest_str = " and ".join(weakest) if weakest else "any specific category"
        
        trend_analysis = (
            f"The candidate is strongest in {strongest_str}, but weaker in {weakest_str}. "
            "Recruiter should verify the weaker areas before shortlisting."
        )
        
    # 6. chart_analysis
    raw_chart = raw_report.get("chart_analysis")
    chart_analysis = {}
    if isinstance(raw_chart, dict):
        chart_analysis = {
            "overall": str(raw_chart.get("overall", "")).strip(),
            "skills": str(raw_chart.get("skills", "")).strip(),
            "experience": str(raw_chart.get("experience", "")).strip(),
            "projects": str(raw_chart.get("projects", "")).strip(),
            "resume_keywords": str(raw_chart.get("resume_keywords", "")).strip(),
            "cover_letter": str(raw_chart.get("cover_letter", "")).strip(),
            "education": str(raw_chart.get("education", "")).strip()
        }
    
    # Fill in fallback key values if empty
    skills_score = prelim.get("skills_score", 0)
    experience_score = prelim.get("experience_score", 0)
    project_score = prelim.get("project_score", 0)
    resume_keyword_score = prelim.get("resume_keyword_score", 0)
    cover_letter_score = prelim.get("cover_letter_score", 0)
    education_score = prelim.get("education_score", 0)

    # Descriptive logic for safe commentary
    skills_desc = "excellent technical match" if percentages["Skills Match"] >= 80 else ("partial technical match" if percentages["Skills Match"] >= 50 else "weak technical match")
    exp_desc = "strong experience alignment" if percentages["Experience Match"] >= 80 else ("moderate experience alignment" if percentages["Experience Match"] >= 50 else "insufficient experience alignment")
    proj_desc = "strong project evidence" if percentages["Project Relevance"] >= 80 else ("moderate project evidence" if percentages["Project Relevance"] >= 50 else "weak project evidence")
    kw_desc = "excellent keyword alignment" if percentages["Resume Keywords"] >= 80 else ("moderate keyword alignment" if percentages["Resume Keywords"] >= 50 else "weak keyword alignment")
    cl_desc = "strong role-specific explanation" if percentages["Cover Letter"] >= 80 else ("moderate role-specific explanation" if percentages["Cover Letter"] >= 50 else "limited role-specific explanation")
    edu_desc = "excellent academic alignment" if percentages["Education Match"] >= 80 else ("good academic alignment" if percentages["Education Match"] >= 50 else "limited academic alignment")

    if not chart_analysis.get("overall"):
        chart_analysis["overall"] = f"Overall score is {overall_score}/100, which places the candidate in {match_level}."
    if not chart_analysis.get("skills"):
        chart_analysis["skills"] = f"Skills score is {skills_score}/35, showing {skills_desc}."
    if not chart_analysis.get("experience"):
        chart_analysis["experience"] = f"Experience score is {experience_score}/20, showing {exp_desc}."
    if not chart_analysis.get("projects"):
        chart_analysis["projects"] = f"Project score is {project_score}/15, showing {proj_desc}."
    if not chart_analysis.get("resume_keywords"):
        chart_analysis["resume_keywords"] = f"Resume keyword score is {resume_keyword_score}/15, showing {kw_desc}."
    if not chart_analysis.get("cover_letter"):
        chart_analysis["cover_letter"] = f"Cover letter score is {cover_letter_score}/10, showing {cl_desc}."
    if not chart_analysis.get("education"):
        chart_analysis["education"] = f"Education score is {education_score}/5, showing {edu_desc}."

    # 7. strengths
    strengths = safe_list(raw_report.get("strengths"))
    if not strengths:
        strengths = safe_list(prelim.get("strengths", []))
        
    # 8. concerns
    concerns = safe_list(raw_report.get("concerns"))
    if not concerns:
        concerns = safe_list(prelim.get("concerns", []))
        
    # 9. recommendation
    recommendation = raw_report.get("recommendation")
    if not recommendation or not str(recommendation).strip():
        recommendation = prelim.get("recommendation") or "Review candidate suitability score profile."
        
    # 10. feedback_summary
    feedback_summary = raw_report.get("feedback_summary")
    if not feedback_summary or not str(feedback_summary).strip():
        feedback_summary = recommendation
        
    # 11. resume_analysis
    resume_analysis = raw_report.get("resume_analysis")
    if not resume_analysis or not str(resume_analysis).strip():
        resume_analysis = prelim.get("resume_analysis") or "Resume contains matching core capabilities."
        
    # 12. cover_letter_analysis
    cover_letter_analysis = raw_report.get("cover_letter_analysis")
    if not cover_letter_analysis or not str(cover_letter_analysis).strip():
        cover_letter_analysis = prelim.get("cover_letter_analysis") or "Cover letter contains standard alignment text."
        
    # 13. project_relevance_summary
    project_relevance_summary = raw_report.get("project_relevance_summary")
    if not project_relevance_summary or not str(project_relevance_summary).strip():
        project_relevance_summary = prelim.get("project_relevance_summary") or "Project portfolio indicates technical alignment."

    return {
        "summary": summary,
        "what_is_good": what_is_good,
        "what_is_missing": what_is_missing,
        "improvement_needed": improvement_needed,
        "trend_analysis": trend_analysis,
        "chart_analysis": chart_analysis,
        "strengths": strengths,
        "concerns": concerns,
        "recommendation": recommendation,
        "feedback_summary": feedback_summary,
        "resume_analysis": resume_analysis,
        "cover_letter_analysis": cover_letter_analysis,
        "project_relevance_summary": project_relevance_summary
    }


# ─── In-House Scoring Engine ─────────────────────────────────────────────────

def score_single_applicant(db: Session, application: JobApplication, job: Job) -> Dict[str, Any]:
    """Core in-house evaluation engine — enriched keyword matching and indicators."""
    candidate: CandidateProfile = db.query(CandidateProfile).filter(
        CandidateProfile.id == application.candidate_id
    ).first()

    if not candidate:
        return {}

    strengths = []
    concerns = []

    resume_doc = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == candidate.id,
        CandidateDocument.document_type == "resume"
    ).first()

    portfolio_doc = db.query(CandidateDocument).filter(
        CandidateDocument.candidate_profile_id == candidate.id,
        CandidateDocument.document_type == "portfolio"
    ).first()

    has_resume = resume_doc is not None
    has_cover_letter = bool(application.cover_letter and application.cover_letter.strip())
    has_portfolio = portfolio_doc is not None or bool(candidate.portfolio_url)
    has_github = bool(candidate.github_url)

    if has_resume and has_cover_letter:
        confidence = "High"
    elif has_resume or has_cover_letter:
        confidence = "Medium"
    else:
        confidence = "Low"

    if not has_resume:
        concerns.append("Resume not available. Evaluated based on digital profile details.")

    if not has_cover_letter:
        concerns.append("Cover letter not available. Cover letter score is 0.")

    jd_text = f"{job.title} {job.description} {job.requirements or ''}"
    jd_keywords = extract_clean_keywords(jd_text)

    job_skills = parse_skills_list(job.required_skills)
    candidate_skills = parse_skills_list([s.skill_name for s in candidate.skills])

    # A. Skills Match (35)
    skills_score = 0
    matched_skills = []
    missing_skills = []

    if not job_skills:
        skills_score = 35
        strengths.append("Matches all job technical core skills.")
    else:
        cand_all_text = f"{candidate.bio or ''} {candidate.target_job_role or ''}"

        for exp in candidate.experiences:
            cand_all_text += f" {exp.job_title or ''} {exp.description or ''}"

        for proj in candidate.projects:
            cand_all_text += f" {proj.title} {proj.description or ''} {proj.tech_stack or ''}"

        cand_extracted_keywords = extract_clean_keywords(cand_all_text)

        for skill in job_skills:
            found = False

            for c_skill in candidate_skills:
                if skill == c_skill or skill in c_skill or c_skill in skill:
                    matched_skills.append(skill)
                    found = True
                    break

            if not found and skill in cand_extracted_keywords:
                matched_skills.append(skill)
                found = True

            if not found:
                missing_skills.append(skill)

        ratio = len(matched_skills) / len(job_skills)
        skills_score = int(35 * ratio)

        if ratio >= 0.8:
            strengths.append(f"Strong technical alignment — matched {len(matched_skills)}/{len(job_skills)} required skills.")
        elif ratio <= 0.3:
            concerns.append("Limited overlap with required technical skills.")

        if missing_skills:
            critical = [
                s for s in missing_skills
                if s in ["react", "python", "javascript", "node", "java", "sql", "aws", "docker"]
            ]
            if critical:
                concerns.append(f"Critical missing skills: {', '.join(critical[:3])}")

    # B. Experience Match (20)
    experience_score = 0
    job_req_years = parse_required_experience(job.experience_required)
    candidate_exp_years = sum([
        exp.years_of_experience
        for exp in candidate.experiences
        if exp.years_of_experience
    ])

    if job_req_years == 0:
        experience_score = 20
        strengths.append("Meets or exceeds job experience parameters.")
    else:
        if candidate_exp_years >= job_req_years:
            experience_score = 20
            strengths.append(f"Excellent professional duration ({candidate_exp_years} yrs vs {job_req_years} yrs required).")
        else:
            experience_score = int(20 * (candidate_exp_years / job_req_years)) if job_req_years > 0 else 20
            concerns.append(f"Years of experience ({candidate_exp_years} yrs) is below requested requirement ({job_req_years} yrs).")

    experience_match_indicators = {
        "required_years": job_req_years,
        "candidate_years": candidate_exp_years,
        "meets_requirement": candidate_exp_years >= job_req_years,
        "summary": f"Requires {job_req_years} years. Candidate has {candidate_exp_years} years."
    }

    if candidate.job_loss_reason:
        strengths.append("Transparent career transition profile provided.")

    # C. Project Relevance (15)
    project_score = 0
    matched_project_skills = set()
    project_summary_points = []

    if not candidate.projects:
        project_score = 0
        concerns.append("No portfolio projects added to candidate profile.")
        project_relevance = "No projects documented in candidate profile."
    else:
        for proj in candidate.projects:
            proj_skills = extract_clean_keywords(
                f"{proj.title} {proj.description or ''} {proj.tech_stack or ''}"
            )
            overlap = [s for s in job_skills if s in proj_skills]

            for item in overlap:
                matched_project_skills.add(item)

            if len(overlap) > 0:
                project_summary_points.append(
                    f"Project '{proj.title}' matches tech: {', '.join(overlap[:3])}"
                )

        if job_skills:
            proj_ratio = len(matched_project_skills) / len(job_skills)
            project_score = int(15 * min(proj_ratio, 1.0))
        else:
            project_score = 15

        if project_score >= 10:
            strengths.append("Demonstrates practical hands-on application of needed skills in projects.")

        project_relevance = (
            "; ".join(project_summary_points)
            if project_summary_points
            else "Projects do not show significant overlap with JD skills."
        )

    project_relevance_indicators = {
        "total_projects": len(candidate.projects),
        "relevant_projects_count": len(project_summary_points),
        "relevant_project_titles": [
            proj.title
            for proj in candidate.projects
            if any(
                s in extract_clean_keywords(
                    f"{proj.title} {proj.description or ''} {proj.tech_stack or ''}"
                )
                for s in job_skills
            )
        ],
        "summary": project_relevance
    }

    # D. Resume Keyword Match (15)
    resume_keyword_score = 0
    matched_keywords = []
    missing_keywords = []
    resume_analysis = ""

    if not has_resume:
        profile_text = f"{candidate.full_name} {candidate.bio or ''} {candidate.target_job_role or ''}"

        for exp in candidate.experiences:
            profile_text += f" {exp.job_title or ''} {exp.description or ''}"

        cand_keywords = extract_clean_keywords(profile_text)
        resume_analysis = "Resume file missing; analysis completed using candidate profile details as fallback."
    else:
        extracted_text = f"{resume_doc.original_file_name} {candidate.bio or ''} {candidate.target_job_role or ''}"

        for exp in candidate.experiences:
            extracted_text += f" {exp.job_title or ''} {exp.description or ''}"

        for skill in candidate.skills:
            extracted_text += f" {skill.skill_name}"

        cand_keywords = extract_clean_keywords(extracted_text)
        resume_analysis = f"Resume '{resume_doc.original_file_name}' processed and matched against JD keywords."

    if jd_keywords:
        match_keywords_set = [kw for kw in jd_keywords if kw in cand_keywords]
        matched_keywords = match_keywords_set[:15]
        missing_keywords = [kw for kw in jd_keywords if kw not in cand_keywords][:15]
        keyword_ratio = len(match_keywords_set) / len(jd_keywords)
        resume_keyword_score = int(15 * keyword_ratio)
    else:
        resume_keyword_score = 15

    if resume_keyword_score >= 12:
        strengths.append("Resume contains high keyword density matching industry keywords.")

    # E. Cover Letter Match (10)
    cover_letter_score = 0
    cover_letter_analysis = ""

    if not has_cover_letter:
        cover_letter_analysis = "Cover letter text not provided for this application."
        cover_letter_score = 0
    else:
        cover_letter_keywords = extract_clean_keywords(application.cover_letter)
        cover_letter_matches = [kw for kw in jd_keywords if kw in cover_letter_keywords]
        cover_letter_raw_score = int(10 * (len(cover_letter_matches) / max(len(jd_keywords[:6]), 1)))
        cover_letter_score = min(cover_letter_raw_score, 10)
        cover_letter_analysis = f"Cover letter matches key objectives with keyword density ({len(cover_letter_matches)} matches)."

        if cover_letter_score >= 8:
            strengths.append("Cover letter showcases high enthusiasm and alignment with company core stack.")

    # F. Education Match (5)
    education_score = 0
    education_required = (job.education_required or "").lower()

    if not candidate.education:
        education_score = 0
        concerns.append("No academic qualifications added to candidate profile.")
    elif not education_required or education_required in ("none", "not specified", ""):
        education_score = 5
        strengths.append("Meets academic baseline.")
    else:
        best_match = 0

        for edu in candidate.education:
            degree = edu.degree.lower()
            field = edu.field_of_study.lower()

            if any(term in degree or term in field for term in education_required.split()):
                best_match = max(best_match, 5)
            elif "bachelor" in degree or "b.tech" in degree or "b.e." in degree or "degree" in degree:
                best_match = max(best_match, 4)
            else:
                best_match = max(best_match, 3)

        education_score = best_match

        if education_score >= 4:
            strengths.append("Education background aligns with required academic credentials.")

    education_summary = "Education matches requirements." if education_score >= 4 else "Education background checked."

    education_match_indicators = {
        "required_education": job.education_required or "Not specified",
        "candidate_degrees": [edu.degree for edu in candidate.education],
        "meets_requirement": education_score >= 4,
        "summary": education_summary
    }

    overall_score = min(
        max(
            skills_score
            + experience_score
            + project_score
            + resume_keyword_score
            + cover_letter_score
            + education_score,
            0
        ),
        100
    )

    match_level = get_match_level(overall_score)

    if match_level == "Excellent":
        recommendation = (
            f"Highly Recommended: {candidate.full_name} exhibits outstanding technical synergy "
            f"({skills_score}/35 skills) and {candidate_exp_years} years of relevant experience."
        )
    elif match_level == "Strong":
        recommendation = "Strong Match: Candidate displays reliable skillset alignment. Recommended for immediate screening and technical review."
    elif match_level == "Good":
        recommendation = "Suitable Candidate: Profile displays stable capabilities. Recommend proceeding to initial recruiter call."
    elif match_level == "Needs Review":
        recommendation = "Review Profile: Candidate has some skills overlap but experience or documents are missing. Suggest brief manual evaluation."
    else:
        recommendation = "Weak Match: The profile shows significant deviations from job requirements. Suggest reviewing other candidates first."

    return {
        "job_id": job.id,
        "application_id": application.id,
        "candidate_profile_id": candidate.id,
        "overall_score": overall_score,
        "match_level": match_level,
        "confidence_level": confidence,
        "skills_score": skills_score,
        "experience_score": experience_score,
        "project_score": project_score,
        "resume_keyword_score": resume_keyword_score,
        "cover_letter_score": cover_letter_score,
        "education_score": education_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "strengths": strengths,
        "concerns": concerns,
        "recommendation": recommendation,
        "resume_analysis": resume_analysis,
        "cover_letter_analysis": cover_letter_analysis,
        "project_relevance_summary": project_relevance,
        "generated_by": "in_house",
        "n8n_execution_id": None,

        "has_resume": has_resume,
        "has_cover_letter": has_cover_letter,
        "has_portfolio": has_portfolio,
        "has_github": has_github,
        "resume_url": f"uploads/resumes/{resume_doc.file_path}" if (has_resume and resume_doc and hasattr(resume_doc, "file_path")) else None,
        "portfolio_url": candidate.portfolio_url or None,
        "github_url": candidate.github_url or None,

        "experience_match_indicators": experience_match_indicators,
        "project_relevance_indicators": project_relevance_indicators,
        "education_match_indicators": education_match_indicators,
    }


# ─── Unified Scoring Entry Point ──────────────────────────────────────────────

def analyze_applicant(db: Session, application: JobApplication, job: Job) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Analyze one applicant using Hugging Face if available, else in-house engine.
    Always runs in-house preliminary matching engine first to obtain fallbacks.
    Returns (score_data, source) where source is 'hf_ai' or 'in_house'.
    Returns (None, 'failed') on total failure.
    """
    try:
        prelim = score_single_applicant(db, application, job)
    except Exception as e:
        logger.error("In-house preliminary scoring failed for application_id=%s: %s", application.id, str(e))
        return None, "failed"

    if not prelim:
        return None, "failed"

    candidate: CandidateProfile = db.query(CandidateProfile).filter(
        CandidateProfile.id == application.candidate_id
    ).first()

    if not candidate:
        return None, "failed"

    # Add candidate full_name to prelim so fallback summary generation has access
    prelim["candidate_profile_name"] = candidate.full_name

    if HF_API_TOKEN:
        payload = build_hf_report_payload(job, application, candidate, prelim)
        raw_hf = call_huggingface_for_report(payload)

        if raw_hf:
            normalized = normalize_hf_report(raw_hf, prelim)
            
            merged = prelim.copy()
            # Overwrite text/report fields from normalized HF AI response
            for field in [
                "summary",
                "feedback_summary",
                "trend_analysis",
                "chart_analysis",
                "what_is_good",
                "what_is_missing",
                "improvement_needed",
                "strengths",
                "concerns",
                "recommendation",
                "resume_analysis",
                "cover_letter_analysis",
                "project_relevance_summary"
            ]:
                merged[field] = normalized.get(field)
                
            merged["generated_by"] = "hf_ai"
            return merged, "hf_ai"

        logger.warning(
            "Hugging Face failed or returned empty for application_id=%s. Falling back to in-house.",
            application.id
        )

    # In-house fallback report values
    normalized_fallback = normalize_hf_report({}, prelim)
    merged_fallback = prelim.copy()
    for field in [
        "summary",
        "feedback_summary",
        "trend_analysis",
        "chart_analysis",
        "what_is_good",
        "what_is_missing",
        "improvement_needed",
        "strengths",
        "concerns",
        "recommendation",
        "resume_analysis",
        "cover_letter_analysis",
        "project_relevance_summary"
    ]:
        merged_fallback[field] = normalized_fallback.get(field)

    if HF_API_TOKEN:
        # If HF was configured but failed, append a concern
        if "concerns" not in merged_fallback or not isinstance(merged_fallback["concerns"], list):
            merged_fallback["concerns"] = list(merged_fallback.get("concerns", []))
        merged_fallback["concerns"].append("AI report generation failed. In-house scoring was used.")
        merged_fallback["what_is_missing"] = list(set(safe_list(merged_fallback.get("missing_skills", [])) + merged_fallback["concerns"]))

    merged_fallback["generated_by"] = "in_house"
    return merged_fallback, "in_house"


# ─── Save ATS Result ──────────────────────────────────────────────────────────

def _save_ats_result(db: Session, score_data: Dict[str, Any]) -> None:
    """Create or update ATSResult row for an application."""
    ats_res = db.query(ATSResult).filter(
        ATSResult.application_id == score_data["application_id"]
    ).first()

    fields = dict(
        overall_score=score_data["overall_score"],
        match_level=score_data["match_level"],
        confidence_level=score_data["confidence_level"],
        skills_score=score_data["skills_score"],
        experience_score=score_data["experience_score"],
        project_score=score_data["project_score"],
        resume_keyword_score=score_data["resume_keyword_score"],
        cover_letter_score=score_data["cover_letter_score"],
        education_score=score_data["education_score"],

        matched_skills=json.dumps(score_data["matched_skills"]),
        missing_skills=json.dumps(score_data["missing_skills"]),
        matched_keywords=json.dumps(score_data["matched_keywords"]),
        missing_keywords=json.dumps(score_data["missing_keywords"]),
        strengths=json.dumps(score_data["strengths"]),
        concerns=json.dumps(score_data["concerns"]),

        recommendation=score_data.get("recommendation"),
        resume_analysis=score_data.get("resume_analysis"),
        cover_letter_analysis=score_data.get("cover_letter_analysis"),
        project_relevance_summary=score_data.get("project_relevance_summary"),

        # 7 New AI Report Columns
        summary=score_data.get("summary"),
        feedback_summary=score_data.get("feedback_summary"),
        trend_analysis=score_data.get("trend_analysis"),
        chart_analysis=json.dumps(score_data.get("chart_analysis", {})),
        what_is_good=json.dumps(score_data.get("what_is_good", [])),
        what_is_missing=json.dumps(score_data.get("what_is_missing", [])),
        improvement_needed=json.dumps(score_data.get("improvement_needed", [])),

        generated_by=score_data.get("generated_by", "in_house"),
        n8n_execution_id=score_data.get("n8n_execution_id"),
        last_run_at=datetime.utcnow(),
    )

    if ats_res:
        for key, value in fields.items():
            setattr(ats_res, key, value)

        ats_res.run_count = (ats_res.run_count or 0) + 1
        ats_res.updated_at = datetime.utcnow()
    else:
        ats_res = ATSResult(
            job_id=score_data["job_id"],
            application_id=score_data["application_id"],
            candidate_profile_id=score_data["candidate_profile_id"],
            run_count=1,
            **fields,
        )
        db.add(ats_res)


# ─── Public Service Functions ─────────────────────────────────────────────────

def run_ats_for_job(db: Session, job_id: int, company_id: int) -> Dict[str, Any]:
    """Run or re-run ATS analysis for all applicants of a job."""
    job = get_job_isolation(db, job_id, company_id)

    applications = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()

    if not applications:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No applicants found for this job posting."
        )

    ranked_count = 0
    failed_count = 0
    sources_used = set()

    for app in applications:
        try:
            score_data, source = analyze_applicant(db, app, job)

            if not score_data:
                failed_count += 1
                continue

            sources_used.add(source)
            _save_ats_result(db, score_data)
            ranked_count += 1
        except Exception as e:
            logger.error("Failed to analyze application_id=%s: %s", app.id, str(e))
            failed_count += 1
            continue

    db.commit()

    if "hf_ai" in sources_used and "in_house" in sources_used:
        generated_by = "mixed"
    elif "hf_ai" in sources_used:
        generated_by = "hf_ai"
    else:
        generated_by = "in_house"

    if failed_count > 0:
        if generated_by == "mixed":
            message = (
                f"ATS Analysis Completed — {ranked_count} Applicants Ranked, {failed_count} Failed. "
                "Some reports used fallback scoring."
            )
        else:
            message = f"ATS Analysis Completed — {ranked_count} Applicants Ranked, {failed_count} Failed."
    else:
        if generated_by == "hf_ai":
            message = f"ATS Analysis Completed — {ranked_count} Applicants Ranked by AI (Hugging Face)."
        elif generated_by == "mixed":
            message = f"ATS Analysis Completed — {ranked_count} Applicants Ranked. Some reports used fallback scoring."
        else:
            message = f"ATS Analysis Completed — {ranked_count} Applicants Ranked."

    try:
        create_notification(
            db,
            job.company.user_id,
            "ATS Analysis Completed",
            f"ATS analysis completed for '{job.title}'. {ranked_count} applicants ranked.",
            "ats",
            job_id=job.id
        )
    except Exception as e:
        logger.warning("Failed to create ATS notification: %s", str(e))

    return {
        "message": message,
        "ranked_count": ranked_count,
        "failed_count": failed_count,
        "generated_by": generated_by,
    }


def rerun_ats_for_applicant(db: Session, application_id: int, company_id: int) -> Dict[str, Any]:
    """Re-run ATS scoring for a specific single application."""
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application record not found."
        )

    job = get_job_isolation(db, application.job_id, company_id)
    score_data, source = analyze_applicant(db, application, job)

    if not score_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate score for candidate profile."
        )

    _save_ats_result(db, score_data)
    db.commit()

    return score_data


def safe_json_loads(val: Any, default: Any) -> Any:
    """Safely load JSON to avoid API crashes on malformed fields."""
    if not val:
        return default
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except Exception:
        return default


def get_ranked_applicants(db: Session, job_id: int, company_id: int) -> List[Dict[str, Any]]:
    """Get all job applications for a job, joined with candidate profile and ATSResults."""
    get_job_isolation(db, job_id, company_id)

    applications = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    results = []

    for app in applications:
        candidate: CandidateProfile = db.query(CandidateProfile).filter(
            CandidateProfile.id == app.candidate_id
        ).first()

        if not candidate:
            continue

        ats_res = db.query(ATSResult).filter(ATSResult.application_id == app.id).first()
        ats_data = None

        if ats_res:
            ats_data = {
                "id": ats_res.id,
                "job_id": ats_res.job_id,
                "application_id": ats_res.application_id,
                "candidate_profile_id": ats_res.candidate_profile_id,
                "overall_score": ats_res.overall_score,
                "match_level": ats_res.match_level,
                "confidence_level": ats_res.confidence_level,

                "skills_score": ats_res.skills_score,
                "experience_score": ats_res.experience_score,
                "project_score": ats_res.project_score,
                "resume_keyword_score": ats_res.resume_keyword_score,
                "cover_letter_score": ats_res.cover_letter_score,
                "education_score": ats_res.education_score,

                "matched_skills": safe_json_loads(ats_res.matched_skills, []),
                "missing_skills": safe_json_loads(ats_res.missing_skills, []),
                "matched_keywords": safe_json_loads(ats_res.matched_keywords, []),
                "missing_keywords": safe_json_loads(ats_res.missing_keywords, []),
                "strengths": safe_json_loads(ats_res.strengths, []),
                "concerns": safe_json_loads(ats_res.concerns, []),

                "recommendation": ats_res.recommendation,
                "resume_analysis": ats_res.resume_analysis,
                "cover_letter_analysis": ats_res.cover_letter_analysis,
                "project_relevance_summary": ats_res.project_relevance_summary,

                # 7 New AI Report Columns
                "summary": ats_res.summary,
                "feedback_summary": ats_res.feedback_summary,
                "trend_analysis": ats_res.trend_analysis,
                "chart_analysis": safe_json_loads(ats_res.chart_analysis, {}),
                "what_is_good": safe_json_loads(ats_res.what_is_good, []),
                "what_is_missing": safe_json_loads(ats_res.what_is_missing, []),
                "improvement_needed": safe_json_loads(ats_res.improvement_needed, []),

                "generated_by": ats_res.generated_by or "in_house",
                "n8n_execution_id": ats_res.n8n_execution_id,

                "analysis_version": ats_res.analysis_version,
                "run_count": ats_res.run_count,
                "last_run_at": ats_res.last_run_at,
                "created_at": ats_res.created_at,
                "updated_at": ats_res.updated_at,
            }

        resume_doc = next(
            (d for d in candidate.documents if d.document_type == "resume"),
            None
        )

        portfolio_doc = next(
            (d for d in candidate.documents if d.document_type == "portfolio"),
            None
        )

        has_resume = resume_doc is not None
        has_cover_letter = bool(app.cover_letter and app.cover_letter.strip())
        has_portfolio = portfolio_doc is not None or bool(candidate.portfolio_url)
        has_github = bool(candidate.github_url)

        resume_url = (
            f"uploads/resumes/{resume_doc.file_path}"
            if has_resume and resume_doc and hasattr(resume_doc, "file_path")
            else None
        )

        results.append({
            "id": app.id,
            "candidate_id": candidate.id,
            "candidate_name": candidate.full_name,
            "target_role": candidate.target_job_role or "Generalist",
            "status": app.status,
            "applied_at": app.applied_at,

            "has_resume": has_resume,
            "has_cover_letter": has_cover_letter,
            "has_portfolio": has_portfolio,
            "has_github": has_github,
            "resume_url": resume_url,
            "portfolio_url": candidate.portfolio_url or None,
            "github_url": candidate.github_url or None,

            "ats_result": ats_data,
        })

    results.sort(
        key=lambda item: (
            item["ats_result"]["overall_score"]
            if item["ats_result"]
            else -1
        ),
        reverse=True
    )

    return results


def get_single_report(db: Session, application_id: int, company_id: int) -> Dict[str, Any]:
    """Get the full detailed ATS Result breakdown for one candidate application."""
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application record not found."
        )

    get_job_isolation(db, application.job_id, company_id)

    ats_res = db.query(ATSResult).filter(ATSResult.application_id == application_id).first()

    if not ats_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS Report has not been run for this application yet. Run ATS Analysis first."
        )

    return {
        "id": ats_res.id,
        "job_id": ats_res.job_id,
        "application_id": ats_res.application_id,
        "candidate_profile_id": ats_res.candidate_profile_id,
        "overall_score": ats_res.overall_score,
        "match_level": ats_res.match_level,
        "confidence_level": ats_res.confidence_level,

        "skills_score": ats_res.skills_score,
        "experience_score": ats_res.experience_score,
        "project_score": ats_res.project_score,
        "resume_keyword_score": ats_res.resume_keyword_score,
        "cover_letter_score": ats_res.cover_letter_score,
        "education_score": ats_res.education_score,

        "matched_skills": safe_json_loads(ats_res.matched_skills, []),
        "missing_skills": safe_json_loads(ats_res.missing_skills, []),
        "matched_keywords": safe_json_loads(ats_res.matched_keywords, []),
        "missing_keywords": safe_json_loads(ats_res.missing_keywords, []),
        "strengths": safe_json_loads(ats_res.strengths, []),
        "concerns": safe_json_loads(ats_res.concerns, []),

        "recommendation": ats_res.recommendation,
        "resume_analysis": ats_res.resume_analysis,
        "cover_letter_analysis": ats_res.cover_letter_analysis,
        "project_relevance_summary": ats_res.project_relevance_summary,

        # 7 New AI Report Columns
        "summary": ats_res.summary,
        "feedback_summary": ats_res.feedback_summary,
        "trend_analysis": ats_res.trend_analysis,
        "chart_analysis": safe_json_loads(ats_res.chart_analysis, {}),
        "what_is_good": safe_json_loads(ats_res.what_is_good, []),
        "what_is_missing": safe_json_loads(ats_res.what_is_missing, []),
        "improvement_needed": safe_json_loads(ats_res.improvement_needed, []),

        "generated_by": ats_res.generated_by or "in_house",
        "n8n_execution_id": ats_res.n8n_execution_id,

        "analysis_version": ats_res.analysis_version,
        "run_count": ats_res.run_count,
        "last_run_at": ats_res.last_run_at,
        "created_at": ats_res.created_at,
        "updated_at": ats_res.updated_at,
    }


def get_job_ats_summary(db: Session, job_id: int, company_id: int) -> Dict[str, Any]:
    """Calculate aggregated metrics for one job's ATS runs."""
    get_job_isolation(db, job_id, company_id)

    applications = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    total_applicants = len(applications)

    ats_results = db.query(ATSResult).filter(ATSResult.job_id == job_id).all()
    ranked_applicants_count = len(ats_results)

    if ranked_applicants_count == 0:
        return {
            "total_applicants": total_applicants,
            "ranked_applicants_count": 0,
            "average_score": 0.0,
            "excellent_count": 0,
            "strong_count": 0,
            "good_count": 0,
            "needs_review_count": 0,
            "weak_count": 0,
            "most_common_missing_skills": [],
            "most_common_matched_skills": [],
            "failed_count": total_applicants - ranked_applicants_count,
        }

    scores = [result.overall_score for result in ats_results]
    avg_score = round(sum(scores) / ranked_applicants_count, 1)

    excellent = sum(1 for result in ats_results if result.match_level == "Excellent")
    strong = sum(1 for result in ats_results if result.match_level == "Strong")
    good = sum(1 for result in ats_results if result.match_level == "Good")
    needs_review = sum(1 for result in ats_results if result.match_level == "Needs Review")
    weak = sum(1 for result in ats_results if result.match_level == "Weak")

    missing_freq: Dict[str, int] = {}
    matched_freq: Dict[str, int] = {}

    for result in ats_results:
        try:
            for skill in safe_json_loads(result.missing_skills, []):
                missing_freq[skill] = missing_freq.get(skill, 0) + 1
        except Exception:
            pass

        try:
            for skill in safe_json_loads(result.matched_skills, []):
                matched_freq[skill] = matched_freq.get(skill, 0) + 1
        except Exception:
            pass

    sorted_missing = sorted(missing_freq.items(), key=lambda item: item[1], reverse=True)
    sorted_matched = sorted(matched_freq.items(), key=lambda item: item[1], reverse=True)

    return {
        "total_applicants": total_applicants,
        "ranked_applicants_count": ranked_applicants_count,
        "average_score": avg_score,
        "excellent_count": excellent,
        "strong_count": strong,
        "good_count": good,
        "needs_review_count": needs_review,
        "weak_count": weak,
        "most_common_missing_skills": [item[0] for item in sorted_missing[:5]],
        "most_common_matched_skills": [item[0] for item in sorted_matched[:5]],
        "failed_count": total_applicants - ranked_applicants_count,
    }