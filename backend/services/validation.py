import re
from typing import List, Dict, Any

VALIDATION_RULES = {
    "date": {
        "required": True,
        "pattern": r"^\d{1,2}/\d{1,2}/\d{2}$",
        "error": "Date must be in DD/M/YY format"
    },
    "shift": {
        "required": True,
        "allowed_values": ["I", "II", "III"],
        "error": "Shift must be I, II, or III"
    },
    "emp_no": {
        "required": True,
        "pattern": r"^BT\d{4}$",
        "error": "Employee No must be BT followed by exactly 4 digits"
    },
    "opn_code": {
        "required": True,
        "pattern": r"^\d{5,6}$",
        "error": "Operation Code must be 5-6 digits"
    },
    "machine_no": {
        "required": True,
        "pattern": r"^(MC|ABC)-\d{3}$",
        "error": "Machine No must be MC-XXX or ABC-XXX format"
    },
    "work_order_no": {
        "required": True,
        "pattern": r"^\d{6,7}$",
        "error": "Work Order No must be 6-7 digits"
    },
    "qty_produced": {
        "required": False,
        "min": 1,
        "max": 9999,
        "warn_if_null": True,
        "error": "Quantity must be a positive integer"
    },
    "time_taken": {
        "required": True,
        "min": 0.5,
        "max": 24.0,
        "error": "Time taken must be between 0.5 and 24.0 hours"
    }
}


def validate_field(field_name: str, field_data: Dict) -> Dict:
    """Validate a single field and return updated field_data with errors."""
    if field_data is None:
        field_data = {"value": None, "confidence": 0.0, "valid": True, "errors": []}

    rules = VALIDATION_RULES.get(field_name, {})
    errors = []
    value = field_data.get("value")

    # Required check
    if rules.get("required") and (value is None or str(value).strip() == ""):
        errors.append(rules.get("error", f"{field_name} is required"))
    elif value is not None and str(value).strip() != "":
        str_value = str(value).strip()

        # Pattern check
        if "pattern" in rules:
            if not re.match(rules["pattern"], str_value):
                errors.append(rules["error"])

        # Allowed values check
        if "allowed_values" in rules:
            if str_value not in rules["allowed_values"]:
                errors.append(rules["error"])

        # Numeric range checks
        if "min" in rules or "max" in rules:
            try:
                num_value = float(value)
                if "min" in rules and num_value < rules["min"]:
                    errors.append(rules["error"])
                if "max" in rules and num_value > rules["max"]:
                    errors.append(rules["error"])
                # Suspicious outlier warnings
                if field_name == "qty_produced" and num_value > 500:
                    errors.append("Warning: Qty > 500 is a suspicious outlier")
                if field_name == "time_taken" and num_value > 12:
                    errors.append("Warning: Time > 12 hours is a suspicious outlier")
            except (ValueError, TypeError):
                errors.append(rules.get("error", f"{field_name} must be a number"))
    elif value is None and rules.get("warn_if_null"):
        errors.append(f"Warning: {field_name} is missing")

    field_data["errors"] = errors
    field_data["valid"] = len([e for e in errors if not e.startswith("Warning")]) == 0
    return field_data


def validate_rows(rows: List[Dict]) -> tuple:
    """Validate all rows and return (validated_rows, validation_summary)."""
    validated_rows = []
    all_errors = 0
    all_warnings = 0
    flagged_fields = []

    # Cross-row validation data
    work_order_counts = {}
    emp_shift_dates = {}

    for row in rows:
        validated_row = {"s_no": row.get("s_no", 0)}
        row_errors = 0

        field_names = ["date", "shift", "emp_no", "opn_code", "machine_no",
                       "work_order_no", "qty_produced", "time_taken"]

        for field_name in field_names:
            field_data = row.get(field_name, {"value": None, "confidence": 0.0, "valid": True, "errors": []})
            if field_data is None:
                field_data = {"value": None, "confidence": 0.0, "valid": True, "errors": []}

            validated_field = validate_field(field_name, field_data.copy() if isinstance(field_data, dict) else {"value": field_data, "confidence": 0.0, "valid": True, "errors": []})
            validated_row[field_name] = validated_field

            for err in validated_field.get("errors", []):
                if err.startswith("Warning"):
                    all_warnings += 1
                    flagged_fields.append({
                        "s_no": row.get("s_no"),
                        "field": field_name,
                        "error": err,
                        "type": "warning"
                    })
                else:
                    all_errors += 1
                    row_errors += 1
                    flagged_fields.append({
                        "s_no": row.get("s_no"),
                        "field": field_name,
                        "error": err,
                        "type": "error"
                    })

        # Track for cross-row validation
        wo_val = validated_row.get("work_order_no", {})
        wo_no = wo_val.get("value") if isinstance(wo_val, dict) else None
        if wo_no:
            work_order_counts[wo_no] = work_order_counts.get(wo_no, 0) + 1

        emp_val = validated_row.get("emp_no", {})
        shift_val = validated_row.get("shift", {})
        date_val = validated_row.get("date", {})
        emp_no = emp_val.get("value") if isinstance(emp_val, dict) else None
        shift = shift_val.get("value") if isinstance(shift_val, dict) else None
        date = date_val.get("value") if isinstance(date_val, dict) else None

        if emp_no and shift and date:
            key = f"{emp_no}_{date}"
            if key not in emp_shift_dates:
                emp_shift_dates[key] = []
            emp_shift_dates[key].append(shift)

        validated_rows.append(validated_row)

    # Cross-row: duplicate work order numbers
    for wo_no, count in work_order_counts.items():
        if count > 1:
            all_warnings += 1
            flagged_fields.append({
                "s_no": "multiple",
                "field": "work_order_no",
                "error": f"Duplicate Work Order No {wo_no} appears {count} times",
                "type": "warning"
            })

    # Cross-row: same employee in multiple shifts on same date
    for key, shifts in emp_shift_dates.items():
        if len(set(shifts)) > 1:
            emp, date = key.rsplit("_", 1)
            all_warnings += 1
            flagged_fields.append({
                "s_no": "multiple",
                "field": "emp_no",
                "error": f"Employee {emp} appears in multiple shifts on {date}",
                "type": "warning"
            })

    validation_summary = {
        "total_errors": all_errors,
        "total_warnings": all_warnings,
        "flagged_fields": flagged_fields
    }

    return validated_rows, validation_summary
