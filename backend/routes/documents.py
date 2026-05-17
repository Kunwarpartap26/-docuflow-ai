from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime, timezone
import os
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")


def serialize_doc(doc):
    """Convert MongoDB doc to JSON-serializable dict."""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id", ""))
    if "upload_timestamp" in doc and hasattr(doc["upload_timestamp"], "isoformat"):
        doc["upload_timestamp"] = doc["upload_timestamp"].isoformat()
    if "reviewed_at" in doc and doc["reviewed_at"] and hasattr(doc["reviewed_at"], "isoformat"):
        doc["reviewed_at"] = doc["reviewed_at"].isoformat()
    return doc


@router.get("/documents")
async def list_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    shift: str = Query(None),
    search: str = Query(None)
):
    from server import app
    db = app.state.db

    query = {}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    cursor = db["documents"].find(query).sort("upload_timestamp", -1).skip(skip).limit(limit)
    docs = []
    async for doc in cursor:
        docs.append(serialize_doc(doc))

    total = await db["documents"].count_documents(query)

    return {
        "documents": docs,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    from server import app
    db = app.state.db

    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return serialize_doc(doc)


@router.get("/documents/{doc_id}/image")
async def get_document_image(doc_id: str):
    from server import app
    db = app.state.db

    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = UPLOAD_DIR / doc["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    return FileResponse(str(file_path))


@router.put("/documents/{doc_id}")
async def update_document(doc_id: str, body: dict):
    from server import app
    from services.validation import validate_rows
    db = app.state.db

    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rows = body.get("rows", [])
    reviewed_by = body.get("reviewed_by")

    # Re-validate rows after manual edit
    validated_rows, validation_summary = validate_rows(rows)
    status = "validated" if validation_summary["total_errors"] == 0 else "reviewed"

    update_data = {
        "rows": validated_rows,
        "validation_summary": validation_summary,
        "status": status,
        "reviewed_at": datetime.now(timezone.utc)
    }
    if reviewed_by:
        update_data["reviewed_by"] = reviewed_by

    await db["documents"].update_one({"_id": doc_id}, {"$set": update_data})

    updated = await db["documents"].find_one({"_id": doc_id})
    return serialize_doc(updated)


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    from server import app
    db = app.state.db

    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file
    file_path = UPLOAD_DIR / doc["filename"]
    if file_path.exists():
        os.remove(str(file_path))

    await db["documents"].delete_one({"_id": doc_id})
    return {"message": "Document deleted successfully"}


@router.post("/documents/{doc_id}/reextract")
async def reextract_document(doc_id: str, background_tasks):
    from server import app
    from routes.upload import process_document
    db = app.state.db

    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = str(UPLOAD_DIR / doc["filename"])
    background_tasks.add_task(process_document, doc_id, file_path, doc["file_type"], db)

    await db["documents"].update_one(
        {"_id": doc_id},
        {"$set": {"status": "processing", "rows": []}}
    )

    return {"message": "Re-extraction started", "id": doc_id}
