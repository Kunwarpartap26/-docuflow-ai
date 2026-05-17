from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import aiofiles
import uuid
import os
from datetime import datetime, timezone
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def process_document(doc_id: str, file_path: str, file_type: str, db):
    """Background task: extract fields and validate."""
    from services.gemini import extract_fields_from_image
    from services.validation import validate_rows

    try:
        # Update status to processing
        await db["documents"].update_one(
            {"_id": doc_id},
            {"$set": {"status": "processing"}}
        )

        # Extract fields
        rows = await extract_fields_from_image(file_path, file_type)

        # Validate rows
        validated_rows, validation_summary = validate_rows(rows)

        # Determine final status
        status = "validated" if validation_summary["total_errors"] == 0 else "extracted"

        await db["documents"].update_one(
            {"_id": doc_id},
            {"$set": {
                "rows": validated_rows,
                "validation_summary": validation_summary,
                "status": status
            }}
        )
    except Exception as e:
        print(f"Error processing document {doc_id}: {e}")
        await db["documents"].update_one(
            {"_id": doc_id},
            {"$set": {"status": "flagged", "error": str(e)}}
        )


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    request=None
):
    from server import app
    db = app.state.db

    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, PDF, and WebP files are supported")

    # Read and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    # Generate unique filename
    doc_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix.lower() or ".jpg"
    saved_filename = f"{doc_id}{ext}"
    file_path = str(UPLOAD_DIR / saved_filename)

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create document record
    file_type = "image" if file.content_type.startswith("image") else "pdf"
    doc = {
        "_id": doc_id,
        "filename": saved_filename,
        "original_filename": file.filename,
        "upload_timestamp": datetime.now(timezone.utc),
        "file_size": len(content),
        "file_type": file_type,
        "status": "processing",
        "rows": [],
        "validation_summary": {"total_errors": 0, "total_warnings": 0, "flagged_fields": []},
        "reviewed_by": None,
        "reviewed_at": None
    }

    await db["documents"].insert_one(doc)

    # Schedule background extraction
    background_tasks.add_task(process_document, doc_id, file_path, file_type, db)

    return JSONResponse({
        "id": doc_id,
        "filename": saved_filename,
        "original_filename": file.filename,
        "status": "processing",
        "message": "File uploaded successfully. Extraction in progress."
    })
