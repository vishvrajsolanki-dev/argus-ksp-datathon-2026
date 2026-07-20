from __future__ import annotations

from typing import Annotated, Any

import networkx as nx
from fastapi import APIRouter, Depends, Query

from backend.database import fetchall, fetchone
from backend.rbac import TokenUser, get_current_user

router = APIRouter(prefix="/graph", tags=["graph"])


def build_graph(case_fir: str | None = None) -> dict[str, Any]:
    G = nx.Graph()
    if case_fir:
        cases = fetchall(
            """SELECT c.id, c.fir_number, c.category, l.zone_id, l.label
               FROM cases c LEFT JOIN locations l ON c.location_id=l.id
               WHERE c.fir_number=%s""",
            (case_fir,),
        )
    else:
        cases = fetchall(
            """SELECT c.id, c.fir_number, c.category, l.zone_id, l.label
               FROM cases c LEFT JOIN locations l ON c.location_id=l.id
               ORDER BY c.occurred_at DESC LIMIT 40"""
        )
    if not cases:
        return {"nodes": [], "edges": []}

    for c in cases:
        cid = f"case:{c['fir_number']}"
        G.add_node(cid, kind="case", label=c["fir_number"], category=c["category"])
        if c["zone_id"]:
            lid = f"loc:{c['zone_id']}"
            G.add_node(lid, kind="location", label=c["label"] or c["zone_id"])
            G.add_edge(cid, lid, rel="occurred_at")
        persons = fetchall(
            "SELECT synthetic_label, role FROM person_refs WHERE case_id=%s",
            (str(c["id"]),),
        )
        for p in persons:
            pid = f"person:{p['synthetic_label']}"
            G.add_node(pid, kind="person_ref", label=p["synthetic_label"], role=p["role"])
            G.add_edge(cid, pid, rel="involves")

    nodes = [{"id": n, **G.nodes[n]} for n in G.nodes]
    edges = [{"source": u, "target": v, **G.edges[u, v]} for u, v in G.edges]
    return {"nodes": nodes, "edges": edges}


@router.get("")
def graph(
    user: Annotated[TokenUser, Depends(get_current_user)],
    case_ref: str | None = Query(None),
):
    return build_graph(case_ref)
