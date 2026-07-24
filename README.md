# Saakshya - Crime Intelligence Platform
## Track B: Relational Intelligence

This repository contains the backend and graph analysis features for the Saakshya MVP, a Crime Intelligence Platform built on Zoho Catalyst.

### Overview

Track B focuses on **Relational Intelligence** — uncovering hidden connections between suspects, cases, and evidence, and providing a secure audit trail for analytical actions.

### Features Built (Track B)

1. **NetworkX Graph Builder (`relational_graph`)**
   - Constructs a comprehensive intelligence graph querying the Catalyst Data Store (`suspects`, `vehicles`, `phones`, `addresses`, `cases`, and `edges`).
   - Automatically computes **Louvain Communities** to group heavily connected criminal networks.
   - Computes **Adamic-Adar Link Scoring** to proactively suggest unconfirmed, highly probable connections (the top 50 suggested links).
   - Resolves every edge to a verifiable source record (e.g., call logs, arrest reports) ensuring **evidence-on-click** explainability.

2. **Role-Verified Action Log (`relational_action_log`)**
   - Provides a secure endpoint (`POST /acknowledge`) for analysts to acknowledge risk flags and predictions with reason codes.
   - Enforces strict role-based access control via **Catalyst Authentication**.
   - Ensures the logged identity is derived securely from the backend token context (`analyst`, `investigating_officer`, `acp_dcp`, `dm`), completely bypassing client-side spoofing.

3. **Standalone Throwaway UI (`test-ui`)**
   - A minimalist Cytoscape.js test interface (`relational-test.html`) designed specifically to validate the graph structure, test community coloring, and execute the acknowledgment workflow with real session auth.

### Architecture

- **Platform:** Zoho Catalyst (Advanced I/O Functions, Data Store, Authentication)
- **Runtime:** Python 3.9
- **Libraries:** NetworkX, Flask, ZCatalyst-SDK

### Schema Contract
The `schema.md` defines the exact structure of our Data Store, ensuring perfectly aligned parallel development with Track A (Spatial Intelligence).

---
*Built for the Karnataka State Police / SCRB Hackathon submission.*
