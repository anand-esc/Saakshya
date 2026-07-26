"""
spatial_bias_audit — Catalyst Function (Track A: Spatial Intelligence)

Reads `predictions`, groups by district_id, computes the false-positive
rate per district plus the sample size `n` — so the frontend can flag
low-confidence districts (e.g. "3 predictions" vs "3,000 predictions")
instead of presenting every district's FPR as equally trustworthy.

Endpoint contract (must match exactly):
    GET /bias-audit  ->  { "districts": [{ district_id, fpr, n }] }

Definition (matches the brief exactly):
    false_positive = predicted_risk_flag == True  AND incident_occurred == False
    true_negative  = predicted_risk_flag == False AND incident_occurred == False
    FPR = false_positives / (false_positives + true_negatives)

    `n` = total number of prediction rows for that district (not just the
    FP/TN subset) — this is a broader "how much do we even know about this
    district" signal than the narrower FPR denominator.

If a district has zero false_positive+true_negative rows (e.g. every
window had an incident, which shouldn't happen with real seed data but
is a real edge case), FPR is reported as null rather than a fabricated
0.0 or divide-by-zero — an undefined rate is not the same as a zero rate.

ALL DATA IS SYNTHETIC — this FPR has no real-world validation, it only
reflects the shape of our generated seed data.

STRUCTURE FOR BATCH USE: `compute_bias_audit()` is a pure function,
`handler()` is the thin HTTP adapter — same pattern as spatial_hotspots,
so this can be wired to a scheduled recompute Job later without change.
"""

import os
import sys

_cur = os.path.dirname(os.path.abspath(__file__))
_possible_paths = [
    _cur,
    os.path.join(_cur, "shared"),
    os.path.join(_cur, "..", "shared"),
    os.path.join(_cur, "..", "..", "..", "functions", "shared")
]
for _p in _possible_paths:
    if os.path.exists(_p) and _p not in sys.path:
        sys.path.insert(0, _p)
from db_utils import get_table_rows  # noqa: E402


def compute_bias_audit(catalyst_app=None):
    """Pure compute function — no HTTP concerns."""
    predictions = get_table_rows("predictions", catalyst_app=catalyst_app)

    by_district = {}
    for p in predictions:
        by_district.setdefault(p["district_id"], []).append(p)

    results = []
    for district_id, rows in sorted(by_district.items()):
        def _bool(val):
            return str(val).lower() in ("true", "1", "yes")

        false_positives = sum(
            1 for r in rows if _bool(r.get("predicted_risk_flag")) and not _bool(r.get("incident_occurred"))
        )
        true_negatives = sum(
            1 for r in rows if not _bool(r.get("predicted_risk_flag")) and not _bool(r.get("incident_occurred"))
        )
        denom = false_positives + true_negatives
        fpr = round(false_positives / denom, 4) if denom else None
        results.append({
            "district_id": district_id,
            "fpr": fpr,
            "n": len(rows),
        })

    return {"districts": results}


def handler(request):
    """
    Thin Catalyst HTTP adapter (Advanced I/O).
    Expects a Flask Request object.
    """
    from flask import make_response, jsonify
    import zcatalyst_sdk
    
    try:
        app = zcatalyst_sdk.initialize()
    except Exception:
        app = None

    try:
        result = compute_bias_audit(catalyst_app=app)
        return make_response(jsonify(result), 200)
    except Exception as e:
        import traceback
        return make_response(jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500)


if __name__ == "__main__":
    import json

    out = compute_bias_audit(catalyst_app=None)
    print(json.dumps(out, indent=2))
