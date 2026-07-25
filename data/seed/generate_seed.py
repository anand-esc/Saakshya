"""
generate_seed.py — Synthetic seed data generator for the KSP/SCRB Crime
Intelligence Platform (Zoho Catalyst Datathon, Round 1).

Owned by: Sibam (Track A — Spatial Intelligence).
Generates CSVs for ALL tables in the schema (mine + Suryansh's Track B),
because we agreed one person owns data generation so both tracks build
against identical, consistent data.

IMPORTANT: Every number produced here is 100% SYNTHETIC. It does not
represent, and must never be presented as, real crime statistics or a
validated model. This script exists to make the demo honest about what
a data-sufficiency badge and a bias audit *would* look like on real
data, not to claim real-world accuracy.

Output: CSV files in data/seed/output/, one per table, ready for
Catalyst Data Store import.

Run:
    python data/seed/generate_seed.py
"""

import csv
import os
import random
from datetime import datetime, timedelta

random.seed(42)  # deterministic seed data across the whole team

OUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUT_DIR, exist_ok=True)

CRIME_TYPES = [
    "theft", "burglary", "chain_snatching", "cybercrime", "robbery", "vehicle_theft",
]

# ---------------------------------------------------------------------------
# 1. DISTRICTS
# ---------------------------------------------------------------------------
# Three districts, each with a distinct region_profile and a deliberately
# different incident density so the data-sufficiency badge actually has
# something to differentiate in the demo:
#   - bengaluru_urban_cyber      -> HIGH density  -> badge should compute GREEN
#   - coastal                    -> MEDIUM density -> badge should compute AMBER
#   - northern_interior_property -> SPARSE density -> badge should compute GREY/AMBER
DISTRICTS = [
    {
        "id": "KA-BLR-URB",
        "name": "Bengaluru Urban",
        "region_profile": "bengaluru_urban_cyber",
        "center": (12.9716, 77.5946),
        "spread": 0.12,
        "n_stations": 6,
        "n_incidents": 480,
    },
    {
        "id": "KA-DKA-CST",
        "name": "Dakshina Kannada",
        "region_profile": "coastal",
        "center": (12.8703, 74.8806),
        "spread": 0.10,
        "n_stations": 4,
        "n_incidents": 140,
    },
    {
        "id": "KA-KLB-NIP",
        "name": "Kalaburagi",
        "region_profile": "northern_interior_property",
        "center": (17.3297, 76.8343),
        "spread": 0.15,
        "n_stations": 3,
        "n_incidents": 35,
    },
]

# ---------------------------------------------------------------------------
# 2. STATIONS
# ---------------------------------------------------------------------------
stations = []
for d in DISTRICTS:
    clat, clng = d["center"]
    for i in range(d["n_stations"]):
        stations.append({
            "id": f"{d['id']}-ST{i+1:02d}",
            "district_id": d["id"],
            "name": f"{d['name']} PS {i+1}",
            "lat": round(clat + random.uniform(-d["spread"], d["spread"]), 6),
            "lng": round(clng + random.uniform(-d["spread"], d["spread"]), 6),
        })

stations_by_district = {}
for s in stations:
    stations_by_district.setdefault(s["district_id"], []).append(s)

# ---------------------------------------------------------------------------
# 3. SUSPECTS / VICTIMS / VEHICLES / PHONES / ADDRESSES  (Suryansh's tables)
# ---------------------------------------------------------------------------
# We still generate these (per the brief: one person owns data generation
# for the whole team) but Track A code never reads or writes them again
# after this script.

FIRST_NAMES = ["Arjun", "Vikram", "Suresh", "Ramesh", "Manoj", "Deepak", "Naveen",
               "Prakash", "Ganesh", "Ravi", "Anil", "Sunil", "Kiran", "Raju"]
LAST_NAMES = ["Kumar", "Reddy", "Naik", "Gowda", "Rao", "Shetty", "Patil", "Hegde"]


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


addresses = []
for i in range(40):
    d = random.choice(DISTRICTS)
    clat, clng = d["center"]
    addresses.append({
        "id": f"ADDR-{i+1:04d}",
        "district_id": d["id"],
        "line": f"{random.randint(1,200)} {random.choice(['Main Rd','Cross St','Market Rd','Station Rd'])}",
        "lat": round(clat + random.uniform(-d["spread"], d["spread"]), 6),
        "lng": round(clng + random.uniform(-d["spread"], d["spread"]), 6),
    })

phones = []
for i in range(60):
    phones.append({
        "id": f"PHN-{i+1:04d}",
        "number_hash": f"HASH{random.randint(10**9,10**10-1)}",
    })

vehicles = []
for i in range(30):
    vehicles.append({
        "id": f"VEH-{i+1:04d}",
        "plate": f"KA{random.randint(1,60):02d}{random.choice('ABCDEFGH')}{random.randint(1000,9999)}",
        "type": random.choice(["two_wheeler", "car", "auto", "van"]),
    })

suspects = []
for i in range(50):
    suspects.append({
        "id": f"SUS-{i+1:04d}",
        "name": random_name(),
        "address_id": random.choice(addresses)["id"],
        "phone_id": random.choice(phones)["id"] if random.random() < 0.7 else "",
        "vehicle_id": random.choice(vehicles)["id"] if random.random() < 0.4 else "",
    })

victims = []
for i in range(40):
    victims.append({
        "id": f"VIC-{i+1:04d}",
        "name": random_name(),
        "address_id": random.choice(addresses)["id"],
    })

# --- Plant 2-3 deliberate suspect/vehicle/address clusters -----------------
# so Louvain community detection on the edges graph finds real communities,
# not one blob or scattered isolated pairs. Each cluster shares an address
# and/or vehicle.
cluster_defs = []
shared_addr_1 = addresses[0]
cluster_1_members = [s["id"] for s in suspects[0:5]]
for sid in cluster_1_members:
    for s in suspects:
        if s["id"] == sid:
            s["address_id"] = shared_addr_1["id"]
cluster_defs.append(("cluster_A_shared_address", cluster_1_members))

shared_addr_2 = addresses[10]
cluster_2_members = [s["id"] for s in suspects[10:14]]
for sid in cluster_2_members:
    for s in suspects:
        if s["id"] == sid:
            s["address_id"] = shared_addr_2["id"]
cluster_defs.append(("cluster_B_shared_address", cluster_2_members))

cluster_3_members = [s["id"] for s in suspects[20:23]]
shared_vehicle = vehicles[0]
for sid in cluster_3_members:
    for s in suspects:
        if s["id"] == sid:
            s["vehicle_id"] = shared_vehicle["id"]
cluster_defs.append(("cluster_C_shared_vehicle", cluster_3_members))

# ---------------------------------------------------------------------------
# 4. CASES (Suryansh's table)
# ---------------------------------------------------------------------------
cases = []
for i in range(60):
    d = random.choice(DISTRICTS)
    cases.append({
        "id": f"CASE-{i+1:05d}",
        "district_id": d["id"],
        "status": random.choice(["open", "closed", "under_investigation"]),
    })

# ---------------------------------------------------------------------------
# 5. INCIDENTS (mine) — density gradient across districts
# ---------------------------------------------------------------------------
# MO texts: mostly generic per crime type. We also plant exactly one
# deliberate CROSS-DISTRICT MO-similarity pair (the demo's opening beat):
# two incidents in DIFFERENT districts with an unusually specific, matching
# MO detail that isn't shared by anything else.
GENERIC_MO_TEMPLATES = {
    "theft": "Item stolen from {loc} during {time}, no witnesses reported.",
    "burglary": "Forced entry via {loc}, valuables removed, occupants absent.",
    "chain_snatching": "Snatched near {loc}, suspect fled on foot.",
    "cybercrime": "Victim reported unauthorized transaction linked to {loc} IP.",
    "robbery": "Suspect(s) threatened victim near {loc}, cash/valuables taken.",
    "vehicle_theft": "Vehicle taken from {loc}, no forced entry signs.",
}
LOCS = ["main market", "bus stand", "residential lane", "ATM kiosk", "parking lot", "highway stretch"]
TIMES = ["early morning", "late night", "afternoon", "peak evening hours"]

CROSS_DISTRICT_MO_SIGNATURE = (
    "Suspect used a distinctive red helmet and disabled CCTV via spray "
    "paint before approaching victim near {loc}."
)

incidents = []
start_date = datetime(2025, 10, 1)

incident_counter = 0
for d in DISTRICTS:
    d_stations = stations_by_district[d["id"]]
    clat, clng = d["center"]
    for i in range(d["n_incidents"]):
        incident_counter += 1
        st = random.choice(d_stations)
        ts = start_date + timedelta(
            days=random.randint(0, 270),
            hours=random.randint(0, 23),
            minutes=random.choice([0, 15, 30, 45]),
        )
        ctype = random.choice(CRIME_TYPES)
        mo = GENERIC_MO_TEMPLATES[ctype].format(
            loc=random.choice(LOCS), time=random.choice(TIMES)
        )
        case_id = random.choice(cases)["id"] if random.random() < 0.6 else ""
        incidents.append({
            "id": f"INC-{incident_counter:05d}",
            "district_id": d["id"],
            "station_id": st["id"],
            "case_id": case_id,
            "crime_type": ctype,
            "lat": round(clat + random.gauss(0, d["spread"] / 3), 6),
            "lng": round(clng + random.gauss(0, d["spread"] / 3), 6),
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S"),
            "mo_text": mo,
        })

# Plant the one deliberate cross-district MO-similarity pair.
mo_pair_districts = [DISTRICTS[0], DISTRICTS[2]]  # Bengaluru Urban <-> Kalaburagi
mo_pair_incident_ids = []
for d in mo_pair_districts:
    incident_counter += 1
    clat, clng = d["center"]
    st = random.choice(stations_by_district[d["id"]])
    ts = start_date + timedelta(days=random.randint(0, 270), hours=random.randint(0, 23))
    inc_id = f"INC-{incident_counter:05d}"
    incidents.append({
        "id": inc_id,
        "district_id": d["id"],
        "station_id": st["id"],
        "case_id": "",
        "crime_type": "robbery",
        "lat": round(clat + random.gauss(0, d["spread"] / 3), 6),
        "lng": round(clng + random.gauss(0, d["spread"] / 3), 6),
        "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S"),
        "mo_text": CROSS_DISTRICT_MO_SIGNATURE.format(loc=random.choice(LOCS)),
    })
    mo_pair_incident_ids.append(inc_id)

# ---------------------------------------------------------------------------
# 6. EDGES (Suryansh's table) — built from the planted clusters + MO pair
# ---------------------------------------------------------------------------
edges = []


def add_edge(src, dst, edge_type, weight=1.0):
    edges.append({
        "id": f"EDGE-{len(edges)+1:05d}",
        "source_id": src,
        "target_id": dst,
        "edge_type": edge_type,
        "weight": weight,
    })


for cname, members in cluster_defs:
    for a, b in zip(members, members[1:]):
        add_edge(a, b, "shared_address_or_vehicle", weight=0.9)
    if len(members) >= 3:
        add_edge(members[0], members[-1], "co_arrest", weight=0.7)

# the cross-district MO-similarity edge — connects the two planted incidents
add_edge(mo_pair_incident_ids[0], mo_pair_incident_ids[1], "mo_similarity", weight=0.95)

# a handful of random low-weight edges as background noise (not enough to
# blur the planted communities)
all_suspect_ids = [s["id"] for s in suspects]
for _ in range(15):
    a, b = random.sample(all_suspect_ids, 2)
    add_edge(a, b, "co_incident", weight=round(random.uniform(0.1, 0.3), 2))

# ---------------------------------------------------------------------------
# 7. PREDICTIONS (mine) — uneven FPR across districts, by design
# ---------------------------------------------------------------------------
# Target: ~8% FPR in Bengaluru Urban (high-sufficiency district),
#         ~22% FPR in Kalaburagi (sparse district), so the bias-audit
# feature has a real, demoable gap instead of a flat line.
#
# FPR = false_positives / (false_positives + true_negatives)
#   false_positive = predicted_risk_flag=TRUE,  incident_occurred=FALSE
#   true_negative   = predicted_risk_flag=FALSE, incident_occurred=FALSE

predictions = []
pred_counter = 0

TARGET_FPR = {
    "KA-BLR-URB": 0.08,
    "KA-DKA-CST": 0.15,
    "KA-KLB-NIP": 0.22,
}

WINDOWS_PER_DAY = ["0000-0600", "0600-1200", "1200-1800", "1800-2400"]

for d in DISTRICTS:
    incident_dates = {
        datetime.strptime(inc["timestamp"], "%Y-%m-%dT%H:%M:%S").date()
        for inc in incidents if inc["district_id"] == d["id"]
    }
    n_days = 30
    cells_no_incident = []
    cells_with_incident = []
    for day_offset in range(n_days):
        day = (start_date + timedelta(days=day_offset)).date()
        had_incident_today = day in incident_dates
        for window in WINDOWS_PER_DAY:
            cell = {
                "day": day,
                "window": window,
                "had_incident": had_incident_today and random.random() < 0.5,
            }
            if cell["had_incident"]:
                cells_with_incident.append(cell)
            else:
                cells_no_incident.append(cell)

    target_fpr = TARGET_FPR[d["id"]]
    n_no_incident = len(cells_no_incident)
    n_false_positives = int(round(target_fpr * n_no_incident))
    fp_indices = set(random.sample(range(n_no_incident), min(n_false_positives, n_no_incident)))

    matching_incidents = [inc for inc in incidents if inc["district_id"] == d["id"]]

    for idx, cell in enumerate(cells_no_incident):
        pred_counter += 1
        flagged = idx in fp_indices
        predictions.append({
            "id": f"PRED-{pred_counter:06d}",
            "district_id": d["id"],
            "time_window": f"{cell['day'].isoformat()}_{cell['window']}",
            "predicted_risk_flag": flagged,
            "incident_occurred": False,
            "incident_id": "",
            "model_version": "synthetic-kde-v0.1",
            "confidence": round(random.uniform(0.55, 0.95) if flagged else random.uniform(0.05, 0.4), 3),
        })

    for cell in cells_with_incident:
        pred_counter += 1
        flagged = random.random() < 0.75
        matched_incident = random.choice(matching_incidents) if matching_incidents else None
        predictions.append({
            "id": f"PRED-{pred_counter:06d}",
            "district_id": d["id"],
            "time_window": f"{cell['day'].isoformat()}_{cell['window']}",
            "predicted_risk_flag": flagged,
            "incident_occurred": True,
            "incident_id": matched_incident["id"] if matched_incident else "",
            "model_version": "synthetic-kde-v0.1",
            "confidence": round(random.uniform(0.55, 0.95) if flagged else random.uniform(0.05, 0.4), 3),
        })

# ---------------------------------------------------------------------------
# 8. ACTION LOG / USERS / ROLES (Suryansh's tables) — minimal stub rows
# ---------------------------------------------------------------------------
roles = [
    {"id": "ROLE-1", "name": "investigator"},
    {"id": "ROLE-2", "name": "supervisor"},
    {"id": "ROLE-3", "name": "admin"},
]
users = []
for i, name in enumerate(["Priya Sharma", "Rohit Menon", "Sunita Iyer"]):
    users.append({"id": f"USR-{i+1:03d}", "name": name, "role_id": roles[i % 3]["id"]})

action_log = []  # empty at seed time — populated at runtime as humans act


# ---------------------------------------------------------------------------
# 9. WRITE CSVs
# ---------------------------------------------------------------------------
def write_csv(name, rows, fieldnames):
    path = os.path.join(OUT_DIR, f"{name}.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    return path


write_csv("districts", DISTRICTS, ["id", "name", "region_profile"])
write_csv("stations", stations, ["id", "district_id", "name", "lat", "lng"])
write_csv("incidents", incidents, ["id", "district_id", "station_id", "case_id", "crime_type", "lat", "lng", "timestamp", "mo_text"])
write_csv("predictions", predictions, ["id", "district_id", "time_window", "predicted_risk_flag", "incident_occurred", "incident_id", "model_version", "confidence"])

# Suryansh's tables — generated here per team agreement, not touched again by Track A
write_csv("suspects", suspects, ["id", "name", "address_id", "phone_id", "vehicle_id"])
write_csv("victims", victims, ["id", "name", "address_id"])
write_csv("vehicles", vehicles, ["id", "plate", "type"])
write_csv("phones", phones, ["id", "number_hash"])
write_csv("addresses", addresses, ["id", "district_id", "line", "lat", "lng"])
write_csv("cases", cases, ["id", "district_id", "status"])
write_csv("edges", edges, ["id", "source_id", "target_id", "edge_type", "weight"])
write_csv("action_log", action_log, ["id", "case_id", "user_id", "action", "timestamp", "notes"])
write_csv("users", users, ["id", "name", "role_id"])
write_csv("roles", roles, ["id", "name"])

# ---------------------------------------------------------------------------
# 10. SANITY-CHECK OUTPUT
# ---------------------------------------------------------------------------
print("=" * 70)
print("SEED GENERATION COMPLETE — ALL VALUES SYNTHETIC, NO REAL-WORLD DATA")
print("=" * 70)

print("\n--- Row counts per table ---")
for name, rows in [
    ("districts", DISTRICTS), ("stations", stations), ("incidents", incidents),
    ("predictions", predictions), ("suspects", suspects), ("victims", victims),
    ("vehicles", vehicles), ("phones", phones), ("addresses", addresses),
    ("cases", cases), ("edges", edges), ("action_log", action_log),
    ("users", users), ("roles", roles),
]:
    print(f"  {name:12s}: {len(rows):5d} rows")

print("\n--- Incident density per district (this drives the badge) ---")
for d in DISTRICTS:
    count = sum(1 for i in incidents if i["district_id"] == d["id"])
    print(f"  {d['id']:12s} ({d['region_profile']:28s}): {count:5d} incidents")

print("\n--- Cluster structure planted for graph community detection ---")
for cname, members in cluster_defs:
    print(f"  {cname}: {len(members)} members -> {members}")
print(f"  cross-district MO-similarity pair: {mo_pair_incident_ids} "
      f"(districts: {mo_pair_districts[0]['id']} <-> {mo_pair_districts[1]['id']})")
print(f"  total edges generated: {len(edges)}")

print("\n--- FPR per district (predictions table) ---")
print(f"  {'district_id':12s} {'n':>6s} {'FP':>6s} {'TN':>6s} {'FPR':>8s}")
fprs = {}
for d in DISTRICTS:
    dpreds = [p for p in predictions if p["district_id"] == d["id"]]
    fp = sum(1 for p in dpreds if p["predicted_risk_flag"] and not p["incident_occurred"])
    tn = sum(1 for p in dpreds if not p["predicted_risk_flag"] and not p["incident_occurred"])
    fpr = fp / (fp + tn) if (fp + tn) else 0.0
    fprs[d["id"]] = fpr
    print(f"  {d['id']:12s} {len(dpreds):6d} {fp:6d} {tn:6d} {fpr:8.3f}")

fpr_values = list(fprs.values())
print(f"\n  FPR gap (max - min): {max(fpr_values) - min(fpr_values):.3f}")

print("\nOutput CSVs written to:", OUT_DIR)
print("\n>>> Review the numbers above before proceeding to Task 2 (spatial_hotspots). <<<")
