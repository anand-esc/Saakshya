<!--
  Standalone section for Track A — merge this into the main README.md.
  Not touching the root README.md directly since it's shared across
  both tracks.
-->

## Track A — Spatial Intelligence

Two Zoho Catalyst Python Functions covering adaptive hotspot mapping
(with an honest data-sufficiency badge) and a false-positive-rate bias
audit by district. All data behind these endpoints is **synthetic seed
data** — nothing here is validated against real crime statistics.

### What these Functions do

- **`functions/spatial_hotspots`** — reads the `incidents` table, fits a
  Gaussian KDE per district over a fixed grid, and returns a density
  value plus a `green` / `amber` / `grey` data-sufficiency badge for
  every grid cell. The badge exists so the map never implies confidence
  it doesn't have: sparse districts show grey/amber, not a
  confident-looking but unsupported hotspot.
- **`functions/spatial_bias_audit`** — reads the `predictions` table
  (keyed on space-time cells, not incidents, so it can represent both
  "flagged, nothing happened" and "flagged, it happened"), and computes
  the false-positive rate per district, plus `n` (sample size) so a
  district with 3 predictions isn't shown with the same confidence as
  one with 3,000.

### Running the seed script

```bash
python data/seed/generate_seed.py
```

This generates CSVs for every table in the schema (both tracks) into
`data/seed/output/`, ready for Catalyst Data Store import, and prints a
sanity-check summary: row counts per table, incident density per
district, planted graph-cluster structure, and the FPR gap across
districts.

### Running/testing locally via Catalyst CLI

> Config note: `catalyst-config.json` in each function folder is a
> best-effort guess at the Catalyst Python Advanced I/O Function schema
> and has **not** been verified against a live Catalyst CLI/project. Run
> `catalyst init` / check `catalyst function:list` against the actual
> project before deploying, and fix these config files directly if the
> real schema differs — don't work around a mismatch silently.

Each Function can also be smoke-tested directly with plain Python,
without Catalyst, by reading the local seed CSVs (`functions/shared/db_utils.py`
falls back to CSV when no `catalyst_app` is passed in):

```bash
python functions/spatial_hotspots/main.py KA-BLR-URB
python functions/spatial_bias_audit/main.py
```

To deploy and test via Catalyst CLI (once `catalyst-config.json` is
confirmed against the current SDK):

```bash
catalyst login
catalyst function:deploy spatial_hotspots
catalyst function:deploy spatial_bias_audit
```

### Endpoints

**`GET /hotspots?district_id=<id>`**

```json
{
  "cells": [
    { "lat": 12.9716, "lng": 77.5946, "density": 0.82, "badge": "green" },
    { "lat": 12.98, "lng": 77.61, "density": 0.05, "badge": "grey" }
  ]
}
```

**`GET /bias-audit`**

```json
{
  "districts": [
    { "district_id": "KA-BLR-URB", "fpr": 0.079, "n": 120 },
    { "district_id": "KA-KLB-NIP", "fpr": 0.220, "n": 120 }
  ]
}
```

### Test UI

`test-ui/spatial-test.html` — throwaway, no build step. Plain Leaflet
map coloring cells by badge, plus a table of the raw `/bias-audit` JSON.
Not part of the final submission; only for sanity-checking these two
endpoints before the real frontend (Slate) wires them in.
