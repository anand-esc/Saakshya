import logging
from flask import Request, make_response, jsonify
import zcatalyst_sdk
import networkx as nx

def handler(request: Request):
    app = zcatalyst_sdk.initialize()
    logger = logging.getLogger()
    
    if request.path == "/graph" and request.method == "GET":
        case_id = request.args.get("case_id")
        
        try:
            zcql = app.zcql()
            
            # Fetch all edges
            edges_resp = zcql.execute_query("SELECT ROWID, id, node_a_type, node_a_id, node_b_type, node_b_id, relation, source_record_type, source_record_id FROM edges")
            
            # Fetch all nodes (for simplicity in MVP, we pull all and map them)
            suspects_resp = zcql.execute_query("SELECT id, name, age, gender, prior_offense_count FROM suspects")
            vehicles_resp = zcql.execute_query("SELECT id, value FROM vehicles")
            phones_resp = zcql.execute_query("SELECT id, value FROM phones")
            addresses_resp = zcql.execute_query("SELECT id, value, lat, lng FROM addresses")
            cases_resp = zcql.execute_query("SELECT id, district_id, mo_taxonomy, status FROM cases")
            
            G = nx.Graph()
            
            nodes_data = {}
            
            def add_nodes(rows, table_name, type_name):
                for row in rows:
                    data = row.get(table_name, {})
                    node_id = data.get("id")
                    if node_id:
                        data["type"] = type_name
                        nodes_data[node_id] = data
                        G.add_node(node_id, **data)
            
            add_nodes(suspects_resp, "suspects", "suspect")
            add_nodes(vehicles_resp, "vehicles", "vehicle")
            add_nodes(phones_resp, "phones", "phone")
            add_nodes(addresses_resp, "addresses", "address")
            add_nodes(cases_resp, "cases", "case")
            
            graph_edges = []
            for row in edges_resp:
                e = row.get("edges", {})
                if e.get("node_a_id") and e.get("node_b_id"):
                    G.add_edge(e["node_a_id"], e["node_b_id"], id=e.get("id"), relation=e.get("relation"), source_record_type=e.get("source_record_type"), source_record_id=e.get("source_record_id"))
                    graph_edges.append(e)
            
            # Louvain Community Detection
            communities = nx.community.louvain_communities(G)
            for i, comm in enumerate(communities):
                for node in comm:
                    if node in nodes_data:
                        nodes_data[node]["community"] = i
            
            # Adamic-Adar Link Scoring (suggested unconfirmed connections)
            # Calculate for node pairs that are not connected but are in the same community or share a neighbor
            suggested_links = []
            try:
                preds = nx.adamic_adar_index(G)
                for u, v, p in preds:
                    if p > 0: # Only suggest links with a score
                        suggested_links.append({
                            "source": u,
                            "target": v,
                            "score": p
                        })
            except Exception as e:
                logger.error(f"Error computing Adamic-Adar: {e}")
            
            # Sort suggested links by score
            suggested_links = sorted(suggested_links, key=lambda x: x["score"], reverse=True)[:50] # Top 50 suggestions
            
            # Map suggested links into edges payload
            for sl in suggested_links:
                graph_edges.append({
                    "id": f"suggested_{sl['source']}_{sl['target']}",
                    "node_a_id": sl["source"],
                    "node_b_id": sl["target"],
                    "relation": "suggested_link",
                    "score": sl["score"]
                })
            
            # Format output
            output_nodes = list(nodes_data.values())
            
            return jsonify({
                "nodes": output_nodes,
                "edges": graph_edges
            }), 200
            
        except Exception as e:
            logger.error(f"Graph Error: {e}")
            return jsonify({"error": str(e)}), 500

    elif request.path.startswith("/graph/edge/") and request.method == "GET":
        edge_id = request.path.split("/")[-1]
        try:
            zcql = app.zcql()
            edges_resp = zcql.execute_query(f"SELECT relation, source_record_type, source_record_id FROM edges WHERE id = '{edge_id}'")
            if not edges_resp:
                return jsonify({"error": "Edge not found"}), 404
                
            edge_data = edges_resp[0].get("edges", {})
            relation = edge_data.get("relation")
            source_type = edge_data.get("source_record_type")
            source_id = edge_data.get("source_record_id")
            
            # Fetch the actual source record (evidence-on-click)
            source_record = {}
            if source_type and source_id:
                # The exact table name for the source record might need mapping, e.g. 'arrest_report' -> 'arrest_reports'
                # Assuming the source_type is the table name for now, or you can map it:
                table_map = {
                    "arrest_report": "arrest_reports", # Wait, these tables don't exist in our schema? 
                    "call_log": "call_logs",
                    "address_record": "addresses"
                }
                # Actually, wait. The schema doc says: "source_record_type | STRING | arrest_report, call_log, address_record". 
                # But it doesn't give us arrest_reports table! I will just return the raw ID and type for the UI to display, 
                # or query it if it's in our tables (like addresses).
                if source_type == "address_record":
                    source_resp = zcql.execute_query(f"SELECT * FROM addresses WHERE id = '{source_id}'")
                    if source_resp:
                        source_record = source_resp[0].get("addresses", {})
                else:
                    # Mock response for external records since we don't own those tables (or they are synthetic)
                    source_record = {"id": source_id, "type": source_type, "note": "External record (Track A or non-relational table)"}
                    
            return jsonify({
                "relation": relation,
                "source_record_type": source_type,
                "source_record": source_record
            }), 200
            
        except Exception as e:
            logger.error(f"Edge Fetch Error: {e}")
            return jsonify({"error": str(e)}), 500

    else:
        return jsonify({"error": "Not Found"}), 404
