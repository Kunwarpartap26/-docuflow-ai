from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from collections import defaultdict

router = APIRouter()


@router.get("/dashboard/stats")
async def get_dashboard_stats():
    from server import app
    db = app.state.db

    total_uploads = await db["documents"].count_documents({})
    records_saved = await db["documents"].count_documents({"status": {"$in": ["validated", "reviewed"]}})
    flagged = await db["documents"].count_documents({"validation_summary.total_errors": {"$gt": 0}})

    # Avg processing time simulation (seconds)
    avg_time = 1.8

    return {
        "total_uploads": total_uploads,
        "validation_failures": flagged,
        "records_saved": records_saved,
        "avg_processing_time": avg_time
    }


@router.get("/dashboard/charts")
async def get_dashboard_charts():
    from server import app
    db = app.state.db

    # Shift-wise uploads
    shift_counts = defaultdict(int)
    machine_counts = defaultdict(int)
    qty_by_machine = defaultdict(int)
    validation_failures = []

    # Last 7 days time series
    today = datetime.now(timezone.utc).date()
    daily_counts = {str(today - timedelta(days=i)): 0 for i in range(6, -1, -1)}

    async for doc in db["documents"].find({}):
        # Daily counts
        ts = doc.get("upload_timestamp")
        if ts:
            if hasattr(ts, "date"):
                date_str = str(ts.date())
            else:
                date_str = str(ts)[:10]
            if date_str in daily_counts:
                daily_counts[date_str] += 1

        for row in doc.get("rows", []):
            shift = row.get("shift", {})
            shift_val = shift.get("value") if isinstance(shift, dict) else None
            if shift_val:
                shift_counts[f"Shift {shift_val}"] += 1

            machine = row.get("machine_no", {})
            machine_val = machine.get("value") if isinstance(machine, dict) else None
            if machine_val:
                machine_counts[machine_val] += 1

                qty = row.get("qty_produced", {})
                qty_val = qty.get("value") if isinstance(qty, dict) else None
                if qty_val:
                    try:
                        qty_by_machine[machine_val] += int(qty_val)
                    except (ValueError, TypeError):
                        pass

        # Collect validation failures
        vs = doc.get("validation_summary", {})
        for flag in vs.get("flagged_fields", []):
            if flag.get("type") == "error":
                validation_failures.append({
                    "document_id": str(doc.get("_id", "")),
                    "date": doc.get("upload_timestamp", "").isoformat() if hasattr(doc.get("upload_timestamp", ""), "isoformat") else str(doc.get("upload_timestamp", "")),
                    "field": flag.get("field"),
                    "error_type": flag.get("error"),
                    "status": doc.get("status", "pending"),
                    "s_no": flag.get("s_no")
                })

    # Format chart data
    shift_data = [{"shift": k, "count": v} for k, v in sorted(shift_counts.items())]
    machine_data = [{"machine": k, "count": v} for k, v in sorted(machine_counts.items(), key=lambda x: -x[1])[:10]]
    time_series = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]
    qty_table = [{"machine": k, "qty": v} for k, v in sorted(qty_by_machine.items(), key=lambda x: -x[1])]

    return {
        "shift_data": shift_data,
        "machine_data": machine_data,
        "time_series": time_series,
        "qty_table": qty_table,
        "validation_failures": validation_failures[:50]
    }
