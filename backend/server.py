from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "docuflow_ai")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    app.state.db = client[DB_NAME]
    app.state.mongo_client = client

    # Create indexes
    await app.state.db["documents"].create_index("upload_timestamp")
    await app.state.db["documents"].create_index("status")

    # Ensure upload directory exists
    Path("uploads").mkdir(exist_ok=True)

    print(f"✅ Connected to MongoDB: {DB_NAME}")
    yield

    # Shutdown
    client.close()
    print("MongoDB connection closed")


app = FastAPI(
    title="DocuFlow AI API",
    description="AI-powered workflow automation for manufacturing documents",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads for static serving
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Import and include routers
from routes.upload import router as upload_router
from routes.documents import router as documents_router
from routes.dashboard import router as dashboard_router
from routes.search import router as search_router

# Override background_tasks injection in documents router
from fastapi import BackgroundTasks as BT


@app.post("/api/documents/{doc_id}/reextract")
async def reextract_document(doc_id: str, background_tasks: BackgroundTasks):
    from routes.upload import process_document
    db = app.state.db

    doc = await db["documents"].find_one({"_id": doc_id})
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = str(Path("uploads") / doc["filename"])
    background_tasks.add_task(process_document, doc_id, file_path, doc["file_type"], db)

    await db["documents"].update_one(
        {"_id": doc_id},
        {"$set": {"status": "processing", "rows": []}}
    )

    return {"message": "Re-extraction started", "id": doc_id}


app.include_router(upload_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(search_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "DocuFlow AI API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
