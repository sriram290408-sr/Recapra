import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recapra.db")
SECRET_KEY = os.getenv("SECRET_KEY", "recapra_super_secret_secure_key_1234567890")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Hugging Face AI Integration
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "").strip() or None
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.3").strip()
HF_TIMEOUT_SECONDS = int(os.getenv("HF_TIMEOUT_SECONDS", "30"))
HF_API_URL = os.getenv("HF_API_URL", "").strip() or None

_fallback_str = os.getenv("HF_FALLBACK_MODELS", "HuggingFaceH4/zephyr-7b-beta,Qwen/Qwen2.5-7B-Instruct").strip()
HF_FALLBACK_MODELS = [m.strip() for m in _fallback_str.split(",") if m.strip()]

# Ensure upload subfolders exist
RESUMES_DIR = os.path.join(UPLOAD_DIR, "resumes")
PORTFOLIOS_DIR = os.path.join(UPLOAD_DIR, "portfolios")
COMPANY_DOCS_DIR = os.path.join(UPLOAD_DIR, "company_docs")

for folder in [RESUMES_DIR, PORTFOLIOS_DIR, COMPANY_DOCS_DIR]:
    os.makedirs(folder, exist_ok=True)