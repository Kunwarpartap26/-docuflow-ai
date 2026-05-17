from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta

router = APIRouter()


def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id", ""))
    if "upload_timestamp" in doc and hasattr(doc["upload_timestamp"], "isoformat"):
        doc["upload_timestamp"] = doc["upload_timestamp"].isoformat()
    if "reviewed_at" in doc and doc["reviewed_at"] and hasattr(doc["reviewed_at"], "isoformat"):
        doc["reviewed_at"] = doc["reviewed_at"].isoformat()
    return doc


@router.get("/search")
async def search_documents(
    q: str = Query(""),
    shift: str = Query(None),
    status: str = Query(None),
    days: int = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    from server import app
    db = app.state.db

    # Build query
    query = {}

    if status:
        query["status"] = status

    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query["upload_timestamp"] = {"$gte": cutoff}

    # Text search across rows
    if q:
        # We'll do in-memory filtering for full-text search on nested fields
        pass

    if shift:
        # Filter by shift value in rows
        query["rows.shift.value"] = shift

    skip = (page - 1) * limit
    cursor = db["documents"].find(query).sort("upload_timestamp", -1).skip(skip).limit(limit)

    docs = []
    async for doc in cursor:
        serialized = serialize_doc(doc)

        # Apply text search filter
        if q:
            q_lower = q.lower()
            matched = False
            # Search in filename
            if q_lower in serialized.get("original_filename", "").lower():
                matched = True
            # Search in rows
            for row in serialized.get("rows", []):
                for field_name in ["emp_no", "machine_no", "work_order_no", "date", "opn_code"]:
                    field = row.get(field_name, {})
                    if isinstance(field, dict):
                        val = str(field.get("value", "")).lower()
                        if q_lower in val:
                            matched = True
                            break
                if matched:
                    break
            if matched:
                docs.append(serialized)
        else:
            docs.append(serialized)

    total = len(docs)

    return {
        "documents": docs,
        "total": total,
        "page": page,
        "limit": limit
    }
