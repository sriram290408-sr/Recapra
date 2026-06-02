import os
from dotenv import load_dotenv

load_dotenv()

# =========================
# Basic App Configuration
# =========================

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recapra.db")

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "recapra_super_secret_secure_key_1234567890"
)

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# =========================
# Environment Detection
# =========================

IS_VERCEL = os.getenv("VERCEL") == "1"


# =========================
# Upload Directory Handling
# =========================
# Local / Render / Railway:
#   uploads/
#
# Vercel:
#   /tmp/uploads
#
# Important:
# Vercel allows writing only inside /tmp.
# Files stored in /tmp are temporary and not permanent.

if IS_VERCEL:
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")
else:
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


# Upload subfolders
RESUMES_DIR = os.path.join(UPLOAD_DIR, "resumes")
PORTFOLIOS_DIR = os.path.join(UPLOAD_DIR, "portfolios")
COMPANY_DOCS_DIR = os.path.join(UPLOAD_DIR, "company_docs")


# Safely create upload folders
# This fixes the Vercel read-only filesystem crash.
for folder in [RESUMES_DIR, PORTFOLIOS_DIR, COMPANY_DOCS_DIR]:
    os.makedirs(folder, exist_ok=True)


# =========================
# Hugging Face AI Integration
# =========================

HF_API_TOKEN = os.getenv("HF_API_TOKEN", "").strip() or None

HF_MODEL_ID = os.getenv(
    "HF_MODEL_ID",
    "mistralai/Mistral-7B-Instruct-v0.3"
).strip()

HF_TIMEOUT_SECONDS = int(
    os.getenv("HF_TIMEOUT_SECONDS", "30")
)

HF_API_URL = os.getenv("HF_API_URL", "").strip() or None

_fallback_str = os.getenv(
    "HF_FALLBACK_MODELS",
    "HuggingFaceH4/zephyr-7b-beta,Qwen/Qwen2.5-7B-Instruct"
).strip()

HF_FALLBACK_MODELS = [
    model.strip()
    for model in _fallback_str.split(",")
    if model.strip()
]