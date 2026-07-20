from __future__ import annotations

import json
from typing import Any
from uuid import UUID

from backend.database import execute


def write_audit(
    *,
    user_id: str,
    role: str,
    action_type: str,
    endpoint: str,
    request_summary: str | None = None,
    ai_output_ref: str | None = None,
    source_records: list[str] | None = None,
) -> str:
    row = execute(
        """INSERT INTO audit_log
           (user_id, role, action_type, endpoint, request_summary, ai_output_ref, source_records)
           VALUES (%s,%s,%s,%s,%s,%s,%s::uuid[])
           RETURNING id""",
        (
            user_id,
            role,
            action_type,
            endpoint,
            request_summary,
            ai_output_ref,
            source_records,
        ),
    )
    return str(row["id"])
