import os
import uuid
from fastapi import UploadFile, HTTPException, status
from config import UPLOAD_DIR, RESUMES_DIR, PORTFOLIOS_DIR, COMPANY_DOCS_DIR

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_EXTENSIONS = {
    "resume": [".pdf", ".doc", ".docx"],
    "portfolio": [".pdf"],
    "company_doc": [".pdf", ".jpg", ".jpeg", ".png"]
}

def validate_and_save_file(file: UploadFile, category: str) -> dict:
    # Validate category
    if category not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file category: {category}"
        )
        
    # Validate extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS[category]:
        allowed_str = ", ".join(ALLOWED_EXTENSIONS[category])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed extensions for {category}: {allowed_str}"
        )
        
    # Read size to validate
    # To check the size without holding the whole file in memory, read chunks
    content = file.file.read()
    file_size = len(content)
    file.file.seek(0)  # Reset pointer
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 5 MB."
        )
        
    # Determine destination folder
    if category == "resume":
        dest_dir = RESUMES_DIR
    elif category == "portfolio":
        dest_dir = PORTFOLIOS_DIR
    else:
        dest_dir = COMPANY_DOCS_DIR
        
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(dest_dir, unique_filename)
    
    # Save file
    with open(dest_path, "wb") as f:
        f.write(content)
        
    # Return file info with relative URL path
    # Normalize paths to use forward slashes
    relative_path = os.path.join("uploads", category + "s" if category != "company_doc" else "company_docs", unique_filename).replace("\\", "/")
    
    return {
        "file_path": relative_path,
        "original_file_name": file.filename,
        "file_size": file_size
    }

def delete_file(relative_path: str):
    if not relative_path:
        return
    full_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", relative_path))
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError:
            pass  # Fail silently if cannot delete
