"""Batch anomaly z-score job (TASK-012)."""
from __future__ import annotations

import argparse
import math
import os
from collections import defaultdict

import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://argus:argus@localhost:5432/argus",
)


def run_once(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT zone_id, DATE(occurred_at) AS d, COUNT(*)::float AS c
            FROM incidents
            GROUP BY zone_id, d
            """
        )
        rows = cur.fetchall()
        by_zone: dict[str, list[float]] = defaultdict(list)
        keyed = []
        for zone_id, d, c in rows:
            by_zone[zone_id].append(float(c))
            keyed.append((zone_id, str(d), float(c)))

        flagged = []
        for zone_id, d, c in keyed:
            vals = by_zone[zone_id]
            mean = sum(vals) / len(vals)
            var = sum((x - mean) ** 2 for x in vals) / max(len(vals), 1)
            std = math.sqrt(var) or 1.0
            z = (c - mean) / std
            if z >= 2.5:
                window = f"day:{d}"
                cur.execute(
                    """INSERT INTO anomaly_flags (zone_id, time_window, z_score, message)
                       VALUES (%s,%s,%s,%s)
                       ON CONFLICT (zone_id, time_window) DO UPDATE SET z_score=EXCLUDED.z_score, message=EXCLUDED.message
                       RETURNING zone_id""",
                    (
                        zone_id,
                        window,
                        z,
                        f"Zone {zone_id} activity z={z:.2f} on {d}",
                    ),
                )
                flagged.append((zone_id, window, z))
        conn.commit()
        print(f"flagged={len(flagged)}")
        for f in flagged:
            print(f)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    conn = psycopg2.connect(DATABASE_URL)
    try:
        if args.once:
            run_once(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
