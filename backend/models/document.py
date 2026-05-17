from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid


class FieldData(BaseModel):
    value: Any = None
    confidence: float = 0.0
    valid: bool = True
    errors: List[str] = []


class DocumentRow(BaseModel):
    s_no: int
    date: Optional[FieldData] = None
    shift: Optional[FieldData] = None
    emp_no: Optional[FieldData] = None
    opn_code: Optional[FieldData] = None
    machine_no: Optional[FieldData] = None
    work_order_no: Optional[FieldData] = None
    qty_produced: Optional[FieldData] = None
    time_taken: Optional[FieldData] = None


class ValidationSummary(BaseModel):
    total_errors: int = 0
    total_warnings: int = 0
    flagged_fields: List[dict] = []


class DocumentCreate(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    file_type: str


class DocumentUpdate(BaseModel):
    rows: List[dict]
    reviewed_by: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    upload_timestamp: datetime
    file_size: int
    file_type: str
    status: str
    rows: List[dict] = []
    validation_summary: dict = {}
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True
