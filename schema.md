### suspects / victims
| Column | Type | Notes |
|---|---|---|
| id | STRING (PK) | |
| name | STRING | synthetic |
| age | INT | |
| gender | STRING | |
| prior_offense_count | INT | suspects only |

### vehicles / phones / addresses
| Column | Type | Notes |
|---|---|---|
| id | STRING (PK) | |
| value | STRING | plate number / phone number / address string |
| lat / lng | DOUBLE | addresses only |

### cases
| Column | Type | Notes |
|---|---|---|
| id | STRING (PK) | |
| district_id | STRING (FK → districts.id) | |
| mo_taxonomy | STRING | entry_method, weapon, target_type, escape_mode |
| status | STRING | open / charge-sheeted / closed |

### edges
| Column | Type | Notes |
|---|---|---|
| id | STRING (PK) | |
| node_a_type / node_a_id | STRING | e.g. `suspect` / `s_042` |
| node_b_type / node_b_id | STRING | |
| relation | STRING | called, co_arrested, same_address, same_vehicle, same_mo |
| source_record_type | STRING | `arrest_report`, `call_log`, `address_record` |
| source_record_id | STRING | never null |

### action_log
| Column | Type | Notes |
|---|---|---|
| id | STRING (PK) | |
| target_type | STRING | `prediction` or `edge` |
| target_id | STRING | the prediction or edge row being acknowledged |
| user_id | STRING (FK → users.id) | role-verified identity |
| reason_code | STRING | |
| action_timestamp | DATETIME | |

### users / roles
| Column | Type | Notes |
|---|---|---|
| id | STRING (PK) | |
| role | STRING | analyst / investigating_officer / acp_dcp / dm |
