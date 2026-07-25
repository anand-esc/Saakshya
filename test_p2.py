import os
import sys

# Set up paths so we can import the functions directly
root_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(root_dir, "functions"))
sys.path.insert(0, os.path.join(root_dir, "functions", "shared"))

from spatial_hotspots.main import compute_hotspots
from spatial_bias_audit.main import compute_bias_audit

def test_bias_audit_shape():
    res = compute_bias_audit(catalyst_app=None)
    assert "districts" in res, "Missing 'districts' key"
    assert isinstance(res["districts"], list), "'districts' should be a list"
    
    for row in res["districts"]:
        assert "district_id" in row
        assert "fpr" in row
        assert "n" in row
        assert isinstance(row["district_id"], str)
        assert row["fpr"] is None or isinstance(row["fpr"], float)
        assert isinstance(row["n"], int)
    
    print("Bias audit shape OK.")

def test_hotspots_shape():
    res = compute_hotspots("KA-BLR-URB", catalyst_app=None)
    assert "cells" in res, "Missing 'cells' key"
    assert isinstance(res["cells"], list), "'cells' should be a list"
    
    for cell in res["cells"]:
        assert "lat" in cell
        assert "lng" in cell
        assert "density" in cell
        assert "badge" in cell
        
        assert isinstance(cell["lat"], float)
        assert isinstance(cell["lng"], float)
        assert isinstance(cell["density"], float)
        assert cell["badge"] in ["green", "amber", "grey"]
        
    print("Hotspots shape OK.")

def test_hotspots_edge_cases():
    # 1. Empty district (FAKE_DISTRICT)
    res = compute_hotspots("FAKE_DISTRICT", catalyst_app=None)
    assert res == {"cells": []}, "Expected empty cells for non-existent district"
    print("Empty district (no stations) OK.")
    
    # 2. District exists in stations but has 0 incidents
    import db_utils
    orig_get = db_utils.get_table_rows
    def mock_get(table, catalyst_app=None):
        data = orig_get(table, catalyst_app)
        if table == "incidents":
            return [] # Simulate no incidents anywhere
        return data
    import spatial_hotspots.main
    orig_get_main = spatial_hotspots.main.get_table_rows
    spatial_hotspots.main.get_table_rows = mock_get
    
    res = compute_hotspots("KA-BLR-URB", catalyst_app=None)
    assert len(res["cells"]) > 0
    for cell in res["cells"]:
        print(f"Density is {cell['density']}, badge is {cell['badge']}")
        assert cell["density"] == 0.0
        assert cell["badge"] == "grey"
        
    spatial_hotspots.main.get_table_rows = orig_get_main
    print("Zero incidents edge case OK.")

def test_bias_audit_edge_cases():
    import db_utils
    orig_get = db_utils.get_table_rows
    def mock_get(table, catalyst_app=None):
        data = orig_get(table, catalyst_app)
        if table == "predictions":
            # Return predictions with only True Positives, no FP or TN
            return [
                {
                    "id": "PRED-1",
                    "district_id": "KA-BLR-URB",
                    "time_window": "2025-10-01_1200-1800",
                    "predicted_risk_flag": True,
                    "incident_occurred": True,
                    "incident_id": "INC-1",
                    "model_version": "v1",
                    "confidence": 0.9
                }
            ]
        return data
    import spatial_bias_audit.main
    orig_get_main = spatial_bias_audit.main.get_table_rows
    spatial_bias_audit.main.get_table_rows = mock_get
    
    res = compute_bias_audit(catalyst_app=None)
    districts = {r["district_id"]: r for r in res["districts"]}
    assert "KA-BLR-URB" in districts
    # The denom (FP+TN) is 0, so fpr should be None
    assert districts["KA-BLR-URB"]["fpr"] is None
    
    spatial_bias_audit.main.get_table_rows = orig_get_main
    print("Zero FP+TN edge case OK.")

if __name__ == "__main__":
    test_bias_audit_shape()
    test_hotspots_shape()
    test_hotspots_edge_cases()
    test_bias_audit_edge_cases()
    
    # test thresholds on real data
    d1 = compute_hotspots("KA-BLR-URB")
    d2 = compute_hotspots("KA-DKA-CST")
    d3 = compute_hotspots("KA-KLB-NIP")
    
    def count_badges(res):
        c = {}
        for x in res["cells"]:
            c[x["badge"]] = c.get(x["badge"], 0) + 1
        return c
        
    print("Thresholds verification:")
    print("KA-BLR-URB (High):", count_badges(d1))
    print("KA-DKA-CST (Med):", count_badges(d2))
    print("KA-KLB-NIP (Low):", count_badges(d3))
