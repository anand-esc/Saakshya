"""
spatial_hotspots — Catalyst Function (Track A: Spatial Intelligence)

Reads `incidents` (joined against `stations`/`districts` only for grouping,
no writes to those tables), computes a hotspot density surface per
district, and attaches a data-sufficiency badge to every cell.

Endpoint contract (must match exactly):
    GET /hotspots?district_id=...  ->  { "cells": [{ lat, lng, density, badge }] }

DESIGN CHOICE — KDE over DBSCAN:
    We use a Gaussian KDE (scipy.stats.gaussian_kde) evaluated on a fixed
    grid, not DBSCAN. Reasoning: the badge needs a continuous, per-cell
    "how much do we actually know here" signal, not just cluster
    membership. KDE gives us a smooth density value at every grid point
    (including empty ones, which is exactly where the badge needs to say
    "grey" instead of just omitting the cell). DBSCAN would tell us where
    clusters ARE but wouldn't naturally score cells with too little data,
    which is the whole point of the sufficiency badge. Trade-off: KDE
    needs a minimum of 2 points per district to fit at all (handled below
    with an explicit fallback to a single flat grey cell).

STRUCTURE FOR BATCH USE:
    `compute_hotspots(district_id)` is a pure function with no HTTP
    concerns. `handler()` is a thin adapter Catalyst calls for the HTTP
    route. The same `compute_hotspots()` can be wired to a Catalyst
    scheduled Job later (e.g. recompute nightly and cache the result)
    without touching this logic — only a new thin adapter is needed.

ALL DATA IS SYNTHETIC. Density values here have no real-world crime
validation; they only reflect the shape of our generated seed data.
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

import numpy as np
from scipy.stats import gaussian_kde

GRID_SIZE = 12  # NxN grid per district — enough resolution for a demo map, cheap to compute

# --- Data-sufficiency badge thresholds (stated explicitly, tune-able) ------
# "local incident count" = number of incidents within RADIUS_DEG of a grid
# point. "time coverage" = number of distinct ISO weeks those incidents span
# (a single day's worth of incidents shouldn't count as "sufficient", even
# if there happen to be a lot of them).
RADIUS_DEG = 0.03           # ~3km at these latitudes — local neighborhood for a grid cell
GREEN_MIN_COUNT = 15
GREEN_MIN_WEEKS = 6
AMBER_MIN_COUNT = 3         # below GREEN but non-zero => amber
# below AMBER_MIN_COUNT => grey


def _week_key(timestamp_str):
    # timestamp_str like "2025-10-01T06:00:00" — cheap week bucketing
    # without pulling in a datetime dependency chain for this.
    try:
        date_part = timestamp_str.split("T")[0]
        y, m, d = (int(x) for x in date_part.split("-"))
        # ISO-ish week number approximation, fine for a coverage signal
        import datetime
        return datetime.date(y, m, d).isocalendar()[1]
    except Exception:  # noqa: BLE001
        return None


def _badge_for_point(lat, lng, incident_points, incident_weeks):
    dists = np.sqrt((incident_points[:, 0] - lat) ** 2 + (incident_points[:, 1] - lng) ** 2)
    nearby_mask = dists <= RADIUS_DEG
    local_count = int(nearby_mask.sum())
    if local_count == 0:
        return "grey", local_count
    local_weeks = {incident_weeks[i] for i, is_near in enumerate(nearby_mask) if is_near}
    if local_count >= GREEN_MIN_COUNT and len(local_weeks) >= GREEN_MIN_WEEKS:
        return "green", local_count
    if local_count >= AMBER_MIN_COUNT:
        return "amber", local_count
    return "grey", local_count


def compute_hotspots(district_id, catalyst_app=None):
    """Pure compute function — no HTTP concerns. Safe to call from a
    scheduled Job as well as the on-demand HTTP handler."""
    all_incidents = get_table_rows("incidents", catalyst_app=catalyst_app)
    district_incidents = [i for i in all_incidents if i["district_id"] == district_id]

    all_stations = get_table_rows("stations", catalyst_app=catalyst_app)
    district_stations = [s for s in all_stations if s["district_id"] == district_id]

    if not district_stations:
        return {"cells": []}

    lats = [float(s["lat"]) for s in district_stations]
    lngs = [float(s["lng"]) for s in district_stations]
    # bounding box padded a bit beyond station spread so hotspots near the
    # edge of the district aren't clipped
    pad = 0.05
    lat_min, lat_max = min(lats) - pad, max(lats) + pad
    lng_min, lng_max = min(lngs) - pad, max(lngs) + pad

    grid_lats = np.linspace(lat_min, lat_max, GRID_SIZE)
    grid_lngs = np.linspace(lng_min, lng_max, GRID_SIZE)
    grid_points = np.array([(la, ln) for la in grid_lats for ln in grid_lngs])

    if len(district_incidents) < 2:
        # Not enough points to fit a KDE at all — every cell is grey,
        # density flat at 0. This IS the correct behavior for a sparse
        # district, not a bug to work around.
        cells = [
            {"lat": round(float(la), 6), "lng": round(float(ln), 6), "density": 0.0, "badge": "grey"}
            for la, ln in grid_points
        ]
        return {"cells": cells}

    incident_points = np.array([(float(i["lat"]), float(i["lng"])) for i in district_incidents])
    incident_weeks = [_week_key(i["time_stamp"]) for i in district_incidents]

    kde = gaussian_kde(incident_points.T)
    densities = kde(grid_points.T)
    # normalize densities to 0-1 for a stable frontend scale regardless of
    # incident volume in this district
    d_min, d_max = densities.min(), densities.max()
    norm_densities = (densities - d_min) / (d_max - d_min) if d_max > d_min else densities * 0

    cells = []
    for idx, (la, ln) in enumerate(grid_points):
        badge, _local_count = _badge_for_point(la, ln, incident_points, incident_weeks)
        cells.append({
            "lat": round(float(la), 6),
            "lng": round(float(ln), 6),
            "density": round(float(norm_densities[idx]), 4),
            "badge": badge,
        })

    return {"cells": cells}


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
        district_id = request.args.get("district_id")
        if not district_id:
            return make_response(jsonify({"error": "district_id query parameter is required"}), 400)

        result = compute_hotspots(district_id, catalyst_app=app)
        return make_response(jsonify(result), 200)
    except Exception as e:
        import traceback
        return make_response(jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500)


if __name__ == "__main__":
    # Local smoke test: python main.py <district_id>
    import json
    import sys as _sys

    test_district = _sys.argv[1] if len(_sys.argv) > 1 else "KA-BLR-URB"
    out = compute_hotspots(test_district, catalyst_app=None)
    print(json.dumps(out, indent=2)[:2000])
    print(f"\n... total cells: {len(out['cells'])}")
    badge_counts = {}
    for c in out["cells"]:
        badge_counts[c["badge"]] = badge_counts.get(c["badge"], 0) + 1
    print("badge distribution:", badge_counts)
