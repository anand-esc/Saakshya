"""
db_utils.py — Shared Data Store access helper.

Shared between Track A (spatial) and Track B (relational/graph) functions.
"""

import csv
import os


def _find_seed_dir():
    cur = os.path.dirname(os.path.abspath(__file__))
    for _ in range(5):
        candidate = os.path.join(cur, "data", "seed", "output")
        if os.path.exists(candidate):
            return candidate
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "seed", "output"))


SEED_DIR = _find_seed_dir()


def _coerce(value):
    if value == "":
        return None
    if value in ("True", "False"):
        return value == "True"
    try:
        if "." in value:
            return float(value)
        return int(value)
    except (ValueError, TypeError):
        return value


def _read_csv_table(table_name):
    path = os.path.join(SEED_DIR, f"{table_name}.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"No local seed CSV for table '{table_name}' at {path}. "
            f"Run data/seed/generate_seed.py first."
        )
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [{k: _coerce(v) for k, v in row.items()} for row in reader]

def _write_csv_table(table_name, row_dict):
    path = os.path.join(SEED_DIR, f"{table_name}.csv")
    file_exists = os.path.exists(path)
    
    # Read existing headers if file exists, else use keys
    fieldnames = list(row_dict.keys())
    if file_exists:
        with open(path, "r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            existing_headers = next(reader, None)
            if existing_headers:
                fieldnames = existing_headers
                # Add any new keys from row_dict that aren't in headers
                for key in row_dict.keys():
                    if key not in fieldnames:
                        fieldnames.append(key)
                        
    # Rewrite with updated headers if necessary, or just append
    # To keep it simple and robust for this demo: just read all, append, write all
    rows = []
    if file_exists:
        with open(path, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
    rows.append(row_dict)
    
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def get_table_rows(table_name, catalyst_app=None):
    """
    Fetch all rows of a Data Store table as a list of dicts.
    """
    if table_name in ("predictions", "edges", "incidents", "stations", "cases", "phones", "addresses"):
        return _read_csv_table(table_name)
        
    if catalyst_app is not None:
        try:
            table = catalyst_app.datastore().table(table_name)
            all_rows = []
            next_token = None
            while True:
                paged_response = table.get_paged_rows(next_token=next_token, max_rows=100)
                if isinstance(paged_response, dict):
                    rows = paged_response.get("data", [])
                    all_rows.extend(rows)
                    next_token = paged_response.get("next_token")
                    if not next_token:
                        break
                else:
                    rows = paged_response.get_rows()
                    all_rows.extend(rows)
                    if paged_response.more_records_available():
                        next_token = paged_response.get_next_token()
                    else:
                        break
            if not all_rows:
                # Fallback to local CSV if Data Store is empty (for rich local testing/demo)
                return _read_csv_table(table_name)
            return all_rows
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"Catalyst Data Store call failed for table '{table_name}': {exc}. "
                f"This is NOT silently falling back to CSV in production — "
                f"fix the SDK call, don't swallow this."
            ) from exc

    return _read_csv_table(table_name)

def insert_table_row(table_name, row_dict, catalyst_app=None):
    if table_name in ("action_log", "predictions", "edges", "incidents", "stations", "cases", "phones", "addresses"):
        _write_csv_table(table_name, row_dict)
        return True
        
    if catalyst_app is not None:
        datastore = catalyst_app.datastore()
        table = datastore.table(table_name)
        table.insert_row(row_dict)
        return True
        
    return False
