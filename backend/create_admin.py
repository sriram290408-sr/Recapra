import os
import sys

# Add backend directory to sys.path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine, SessionLocal
from models.user import User
from models.candidate import CandidateProfile
from models.company import CompanyProfile
from core.security import get_password_hash

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        admin = db.query(User).filter(User.email == "admin@recapra.com").first()
        if not admin:
            print("Seeding Admin User...")
            admin_user = User(
                name="Platform Admin",
                email="admin@recapra.com",
                hashed_password=get_password_hash("adminpassword123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin User created successfully!")
            print("Email: admin@recapra.com | Password: adminpassword123")
        else:
            print("Admin user already exists.")
            
        candidate = db.query(User).filter(User.email == "candidate@recapra.com").first()
        if not candidate:
            print("Seeding Candidate User (John Doe)...")
            cand_user = User(
                name="John Doe",
                email="candidate@recapra.com",
                hashed_password=get_password_hash("candidatepassword123"),
                role="candidate",
                is_active=True
            )
            db.add(cand_user)
            db.commit()
            db.refresh(cand_user)
            
            # Create Candidate Profile
            cand_profile = CandidateProfile(
                user_id=cand_user.id,
                full_name="John Doe",
                bio="Experienced software engineer passionate about scalable frontend systems.",
                phone="1234567890",
                location="San Francisco, CA",
                career_status="active_seeking",
                target_job_role="Frontend Engineer",
                profile_completion_pct=60
            )
            db.add(cand_profile)
            db.commit()
            print("Candidate User created successfully!")
            print("Email: candidate@recapra.com | Password: candidatepassword123")
        else:
            print("Candidate user already exists.")
            
        company = db.query(User).filter(User.email == "company@recapra.com").first()
        if not company:
            print("Seeding Company User (Tech Solutions)...")
            comp_user = User(
                name="Tech Solutions Inc",
                email="company@recapra.com",
                hashed_password=get_password_hash("companypassword123"),
                role="company",
                is_active=True
            )
            db.add(comp_user)
            db.commit()
            db.refresh(comp_user)
            
            # Create Company Profile
            comp_profile = CompanyProfile(
                user_id=comp_user.id,
                company_name="Tech Solutions Inc",
                company_email="hr@techsolutions.com",
                hr_name="Sarah Jenkins",
                hr_email="sjenkins@techsolutions.com",
                contact_number="9876543210",
                website="https://techsolutions.example.com",
                location="New York, NY",
                industry="Information Technology",
                company_size="100-500 employees",
                description="Seeding high quality enterprise solutions for modern day digital challenges.",
                is_verified=False,
                verification_status="pending"
            )
            db.add(comp_profile)
            db.commit()
            print("Company User created successfully!")
            print("Email: company@recapra.com | Password: companypassword123")
        else:
            print("Company user already exists.")
            
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
