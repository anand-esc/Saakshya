import logging
from flask import Request, make_response, jsonify
import zcatalyst_sdk
import networkx as nx

def handler(request: Request):
    app = zcatalyst_sdk.initialize()
    logger = logging.getLogger()
    
    if request.path == "/graph" and request.method == "GET":
        case_id = request.args.get("case_id")
        import os, sys
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
        import db_utils
        
        try:
            zcql = app.zcql()
            
            edges_data = db_utils.get_table_rows("edges")
            
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
            suggested_links = []
            
            for e in edges_data:
                if e.get("source_id") and e.get("target_id"):
                    G.add_edge(e["source_id"], e["target_id"], id=e.get("id"), relation=e.get("edge_type"), weight=e.get("weight"))
                    
                    source_record_type = e.get("source_record_type")
                    if source_record_type in ("arrest_report", "call_log", "address_record"):
                        graph_edges.append({
                            "node_a_id": e["source_id"],
                            "node_b_id": e["target_id"],
                            "id": e.get("id"),
                            "relation": e.get("edge_type"),
                            "weight": e.get("weight"),
                            "source_record_type": source_record_type,
                            "source_record_id": e.get("source_record_id")
                        })
                    else:
                        suggested_links.append({
                            "source": e["source_id"],
                            "target": e["target_id"],
                            "score": e.get("weight"),
                            "relation": e.get("edge_type")
                        })
            
            # Louvain Community Detection
            communities = nx.community.louvain_communities(G)
            for i, comm in enumerate(communities):
                for node in comm:
                    if node in nodes_data:
                        nodes_data[node]["community"] = i
            
            # Adamic-Adar Link Scoring (suggested unconfirmed connections)
            # Calculate for node pairs that are not connected but are in the same community or share a neighbor
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
            
            # Format output
            output_nodes = list(nodes_data.values())
            
            return jsonify({
                "nodes": output_nodes,
                "edges": graph_edges,
                "suggested_links": suggested_links
            }), 200
            
        except Exception as e:
            logger.error(f"Graph Error: {e}")
            return jsonify({"error": str(e)}), 500

    elif request.path.startswith("/graph/edge/") and request.method == "GET":
        edge_id = request.path.split("/")[-1]
        import os, sys
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
        import db_utils
        try:
            edges_data = db_utils.get_table_rows("edges")
            edge_data = next((e for e in edges_data if e.get("id") == edge_id), None)
            
            if not edge_data:
                return jsonify({"error": "Edge not found"}), 404
                
            relation = edge_data.get("edge_type")
            weight = edge_data.get("weight")
            
            source_record_type = edge_data.get("source_record_type") or "derived_edge"
            source_record_id = edge_data.get("source_record_id")
            
            source_record = {
                "id": source_record_id if source_record_id else edge_data.get("source_id"), 
                "target": edge_data.get("target_id"), 
                "note": f"Edge weight: {weight}"
            }
                    
            return jsonify({
                "id": edge_id,
                "relation": relation,
                "source_record_type": source_record_type,
                "source_record": source_record
            }), 200
            
        except Exception as e:
            logger.error(f"Edge Fetch Error: {e}")
            return jsonify({"error": str(e)}), 500

    else:
        return jsonify({"error": "Not Found"}), 404
