# Saakshya — Explainable Crime Intelligence Platform

**Built for Karnataka State Police / SCRB on Zoho Catalyst.**

Saakshya unifies FIR, arrest, and case data into three explainable intelligence features — every prediction is backed by visible evidence, a live bias audit, and a human required to act on any alert. Built to be challenged, not just trusted.

---

## Table of Contents
- [What This Is](#what-this-is)
- [Features](#features)
  - [Spatial Intelligence (Track A)](#spatial-intelligence-track-a)
  - [Relational Intelligence (Track B)](#relational-intelligence-track-b)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Setup & Local Development](#setup--local-development)
- [Compliance & Governance](#compliance--governance)
- [Team](#team)
- [Roadmap](#roadmap)

---

## What This Is

Saakshya is an explainable crime-intelligence layer for Karnataka State Police/SCRB. Built on Zoho Catalyst, it unifies FIR, arrest, and case data to surface three things investigators actually need: adaptive crime hotspots with a visible data-sufficiency badge (so sparse-data areas are shown honestly, not smoothed over), an evidence-first criminal network graph where every link opens its real source record, and a live bias-audit panel showing false-positive-rate parity across districts. Every risk flag requires a named analyst's acknowledgment and reason code before any action is logged — no prediction acts alone. Data is localized to Zoho's India data center per the DPDP Act 2023. Unlike opaque predictive-policing tools, Saakshya shows its evidence and its error rate by design — built to be challenged, not just trusted.

---

## Features

### Spatial Intelligence (Track A)
**Owner: Sibam**

- **Adaptive Hotspot Mapping + Data-Sufficiency Badge**
  <!-- TODO: 2-3 sentences — KDE/DBSCAN/Getis-Ord Gi*, what the badge shows (green/amber/grey), why it matters (doesn't hallucinate confidence in sparse-data areas) -->
- **Bias Audit Panel**
  <!-- TODO: 2-3 sentences — FPR-by-district metric, what it displays, why FPR was chosen over overall accuracy for a policing context -->

**Endpoints:**
```
GET /hotspots?district_id=...   → { cells: [{ lat, lng, density, badge }] }
GET /bias-audit                 → { districts: [{ district_id, fpr, n }] }
```

**Screenshot(s):**
<!-- TODO: insert hotspot map + bias panel screenshots -->

---

### Relational Intelligence (Track B)
**Owner: Suryansh**

- **Evidence-First Criminal Network Graph**
  A graph of suspects, vehicles, phone numbers, and addresses built with NetworkX — Louvain community detection surfaces clusters, Adamic-Adar scoring suggests likely-but-unconfirmed links. Every confirmed edge is clickable and opens the exact source record (arrest report, call log, or address record) that created it. Algorithmic suggestions are kept structurally separate from evidence-backed edges (`suggested_links`, not `edges`) so an unconfirmed guess is never presented with the same weight as verified proof.
- **Human-in-the-Loop Action Log**
  Every risk flag or suggested link requires an analyst's acknowledgment and a reason code before it's marked actioned, logged with a role-verified identity via Catalyst Authentication. Nothing the system outputs is acted on without a named human deciding to act on it.

**Endpoints:**
```
GET /graph?case_id=...           → { nodes: [...], edges: [...], suggested_links: [...] }
GET /graph/edge/:id              → { relation, source_record_type, source_record }
POST /action-log/acknowledge     → { target_type, target_id, user_id, reason_code }
```

**Screenshot(s):**
<!-- TODO: insert graph + acknowledgment flow screenshots -->

---

## Architecture

<!-- TODO: one diagram or short paragraph — two independent backend tracks (spatial,
     relational) sharing one Data Store and one Authentication layer, fronted by a
     single Slate dashboard. Mention the deliberate table-ownership split if it's a
     talking point worth keeping. -->

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Zoho Catalyst Functions (Python 3.9, Advanced I/O) |
| Database | Catalyst Data Store |
| Auth | Catalyst Authentication (4 roles: analyst, investigating_officer, acp_dcp, dm) |
| Spatial analysis | KDE / DBSCAN / Getis-Ord Gi* |
| Graph analysis | NetworkX (Louvain communities, Adamic-Adar link scoring) |
| Frontend | Slate |
| Hosting/localization | Zoho Catalyst, India data center |

---

## Data Model

Full schema, table ownership, and the locked API contract: see [`schema.md`](./schema.md).

---

## Setup & Local Development

```powershell
# Install Catalyst CLI
npm install -g zcatalyst-cli

# Login
catalyst login

# Link this directory to the Saakshya project
catalyst init

# Serve all functions locally
catalyst serve
```

Requires **Python 3.9** specifically (Catalyst's supported runtime ceiling) — see [`schema.md`](./schema.md) for the full environment setup used during development.

**Note:** Seed data is pre-loaded in `data/seed/output/`, no manual setup needed.

---

## Compliance & Governance

- **DPDP Act 2023** — FIR, victim, and case data processed under the Act's law-enforcement exemption pathway, with purpose limitation documented per data category.
- **Data localization** — all Data Store instances pinned to Zoho's India data center; no cross-border replication without an explicit inter-agency agreement.
- **Victim data minimization** — victim-facing views expose stage-only case status; no suspect, evidence, or investigation detail is ever queryable by a victim-scoped credential.
- **Fairness methodology** — false-positive-rate parity across districts is the primary fairness metric, chosen because a false positive in this context means a patrol resource or an officer's attention directed at a bad signal. No caste or religion field is used as a model input; the audit panel exists because removing those fields does not remove geographic proxy correlation, and the FPR gap is published rather than hidden.

---

## Team

| Name | Role / Track |
|---|---|
| Sibam | Spatial Intelligence (Track A) |
| Suryansh | Relational Intelligence (Track B) |
| Pritam | Slate Frontend |
| Supriya | Slate Frontend |
| Ananya | Pitch Deck & Presentation |

---

## Roadmap

Deliberately not built for this submission — see the full Prototype Brief for the reasoning:
- Sociological Correlation Engine — **cut**, not deferred (stigmatization risk to poor/migrant communities)
- Voice-Query Investigative Assistant — needs QuickML RAG early access, not guaranteed in time
- MO Discovery Engine, Anomaly Detection, Repeat Offender Profiles
- Court-Outcome Feedback Loop, Inter-Agency Data Gateway, live CCTNS integration
- Offline-First Mobile Companion, Public Safety Transparency Dashboard
