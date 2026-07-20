"""
ARGUS synthetic seed — NCRB-calibrated distributions (timeboxed placeholders ok).
Includes fixed canary case for critic demo (CONTRACT / TASK-001 / TASK-003).
"""
from __future__ import annotations

import argparse
import json
import os
import random
import uuid
from datetime import datetime, timedelta, timezone

import psycopg2
from faker import Faker
from passlib.context import CryptContext

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://argus:argus@localhost:5432/argus",
)

# Locked canary IDs — do not change without updating TASK-003 tests
CANARY_CASE_ID = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
CANARY_FIR = "FIR-CANARY-2026-0001"
CANARY_QUESTION = (
    "What weapon was used in the MG Road theft case FIR-CANARY-2026-0001?"
)

CATEGORIES = [
    ("theft", 0.28),
    ("burglary", 0.18),
    ("assault", 0.14),
    ("fraud", 0.12),
    ("vehicle_theft", 0.10),
    ("cybercrime", 0.08),
    ("robbery", 0.06),
    ("other", 0.04),
]

BANGALORE_ZONES = [
    ("BLR-MG", "MG Road", 12.9750, 77.6060),
    ("BLR-IND", "Indiranagar", 12.9784, 77.6408),
    ("BLR-WHT", "Whitefield", 12.9698, 77.7500),
    ("BLR-KOR", "Koramangala", 12.9352, 77.6245),
    ("BLR-JAY", "Jayanagar", 12.9308, 77.5838),
    ("BLR-MAL", "Malleshwaram", 13.0035, 77.5640),
    ("BLR-ELE", "Electronic City", 12.8452, 77.6602),
    ("BLR-YEL", "Yelahanka", 13.1005, 77.5963),
]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
fake = Faker()
Faker.seed(2026)
random.seed(2026)


def connect():
    return psycopg2.connect(DATABASE_URL)


def reset_schema(conn):
    with conn.cursor() as cur, open(
        os.path.join(os.path.dirname(__file__), "schema.sql"), "r", encoding="utf-8"
    ) as f:
        cur.execute(
            """
            DROP TABLE IF EXISTS audit_log CASCADE;
            DROP TABLE IF EXISTS ask_responses CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS billing_subscriptions CASCADE;
            DROP TABLE IF EXISTS anomaly_flags CASCADE;
            DROP TABLE IF EXISTS person_refs CASCADE;
            DROP TABLE IF EXISTS incidents CASCADE;
            DROP TABLE IF EXISTS cases CASCADE;
            DROP TABLE IF EXISTS officers CASCADE;
            DROP TABLE IF EXISTS locations CASCADE;
            DROP TABLE IF EXISTS stations CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            """
        )
        cur.execute(f.read())
    conn.commit()


def weighted_category():
    r = random.random()
    acc = 0.0
    for name, w in CATEGORIES:
        acc += w
        if r <= acc:
            return name
    return "other"


def seed(conn, n_cases: int = 120):
    with conn.cursor() as cur:
        station_ids = []
        for i, (zone_id, label, lat, lng) in enumerate(BANGALORE_ZONES):
            sid = uuid.uuid4()
            station_ids.append(sid)
            cur.execute(
                "INSERT INTO stations (id, name, district, code) VALUES (%s,%s,%s,%s)",
                (str(sid), f"{label} PS", "Bengaluru Urban", f"STN-{i+1:02d}"),
            )

        location_ids = []
        for zone_id, label, lat, lng in BANGALORE_ZONES:
            lid = uuid.uuid4()
            location_ids.append((lid, zone_id, label, lat, lng))
            cur.execute(
                """INSERT INTO locations (id, zone_id, label, district, lat, lng)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (str(lid), zone_id, label, "Bengaluru Urban", lat, lng),
            )

        officer_ids = []
        for i, sid in enumerate(station_ids):
            oid = uuid.uuid4()
            officer_ids.append(oid)
            cur.execute(
                """INSERT INTO officers (id, name, badge_no, station_id, rank)
                   VALUES (%s,%s,%s,%s,%s)""",
                (str(oid), fake.name(), f"KSP-{1000+i}", str(sid), "Inspector"),
            )

        # Canary case: theft on MG Road — attributes do NOT include a weapon.
        # Advisor may hallucinate "knife"; critic must flag (no entity+attribute pair).
        mg = next(x for x in location_ids if x[1] == "BLR-MG")
        cur.execute(
            """INSERT INTO cases
               (id, fir_number, category, status, summary, station_id, location_id,
                officer_id, occurred_at, attributes, is_canary)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)""",
            (
                str(CANARY_CASE_ID),
                CANARY_FIR,
                "theft",
                "open",
                (
                    "Synthetic canary: mobile phone snatching near MG Road metro. "
                    "No weapon was reported. Suspect fled on foot toward Brigade Road. "
                    "Complainant recovered CCTV stills from shopfront camera."
                ),
                str(station_ids[0]),
                str(mg[0]),
                str(officer_ids[0]),
                datetime(2026, 6, 12, 19, 40, tzinfo=timezone.utc),
                json.dumps(
                    {
                        "weapon": None,
                        "weapon_reported": False,
                        "property": "mobile phone",
                        "modus": "snatching",
                        "location_landmark": "MG Road metro",
                    }
                ),
                True,
            ),
        )
        cur.execute(
            """INSERT INTO person_refs (case_id, role, synthetic_label, attributes)
               VALUES (%s,%s,%s,%s::jsonb)""",
            (
                str(CANARY_CASE_ID),
                "complainant",
                "SYN-PERSON-CANARY-01",
                json.dumps({"injury": False}),
            ),
        )
        cur.execute(
            """INSERT INTO incidents
               (case_id, location_id, zone_id, incident_type, occurred_at, severity)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (
                str(CANARY_CASE_ID),
                str(mg[0]),
                "BLR-MG",
                "theft",
                datetime(2026, 6, 12, 19, 40, tzinfo=timezone.utc),
                2,
            ),
        )

        now = datetime.now(timezone.utc)
        for i in range(n_cases):
            cat = weighted_category()
            lid, zone_id, label, lat, lng = random.choice(location_ids)
            sid = random.choice(station_ids)
            oid = random.choice(officer_ids)
            occurred = now - timedelta(days=random.randint(1, 180), hours=random.randint(0, 23))
            # Weekend / evening bias
            if random.random() < 0.35:
                occurred = occurred.replace(hour=random.choice([18, 19, 20, 21, 22]))
            case_id = uuid.uuid4()
            fir = f"FIR-BLR-2026-{i+2:04d}"
            weapon = None
            if cat in ("robbery", "assault") and random.random() < 0.4:
                weapon = random.choice(["knife", "blunt object", "firearm"])
            summary = (
                f"Synthetic {cat} incident near {label}. "
                f"{'Weapon reported: ' + weapon + '. ' if weapon else 'No weapon reported. '}"
                f"Filed under NCRB-shaped category {cat}."
            )
            attrs = {
                "weapon": weapon,
                "weapon_reported": bool(weapon),
                "property": fake.word() if cat in ("theft", "burglary", "vehicle_theft") else None,
                "modus": random.choice(["snatching", "break-in", "deception", "confrontation", "online"]),
                "location_landmark": label,
            }
            cur.execute(
                """INSERT INTO cases
                   (id, fir_number, category, status, summary, station_id, location_id,
                    officer_id, occurred_at, attributes, is_canary)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s)""",
                (
                    str(case_id),
                    fir,
                    cat,
                    random.choice(["open", "under_investigation", "closed"]),
                    summary,
                    str(sid),
                    str(lid),
                    str(oid),
                    occurred,
                    json.dumps(attrs),
                    False,
                ),
            )
            cur.execute(
                """INSERT INTO person_refs (case_id, role, synthetic_label, attributes)
                   VALUES (%s,%s,%s,%s::jsonb)""",
                (str(case_id), "complainant", f"SYN-PERSON-{i+2:04d}", json.dumps({})),
            )
            # denser incidents in MG / Indiranagar evenings
            repeats = 3 if zone_id in ("BLR-MG", "BLR-IND") else 1
            for _ in range(repeats):
                cur.execute(
                    """INSERT INTO incidents
                       (case_id, location_id, zone_id, incident_type, occurred_at, severity)
                       VALUES (%s,%s,%s,%s,%s,%s)""",
                    (
                        str(case_id),
                        str(lid),
                        zone_id,
                        cat,
                        occurred - timedelta(hours=random.randint(0, 5)),
                        random.randint(1, 5),
                    ),
                )

        # Users
        users = [
            ("investigator@example.com", "Investigator One", "investigator", "pilot123"),
            ("analyst@example.com", "Analyst One", "analyst", "pilot123"),
            ("admin@example.com", "Admin One", "admin", "pilot123"),
        ]
        for email, name, role, password in users:
            cur.execute(
                """INSERT INTO users (email, full_name, hashed_password, role, is_verified)
                   VALUES (%s,%s,%s,%s,%s)""",
                (email, name, pwd_context.hash(password), role, True),
            )

        cur.execute(
            """INSERT INTO billing_subscriptions (org_name, plan, seats, status)
               VALUES (%s,%s,%s,%s)""",
            ("KSP Pilot Station", "pilot", 10, "active"),
        )

        cur.execute(
            """INSERT INTO notifications (user_id, title, body, kind)
               SELECT id, %s, %s, %s FROM users WHERE email=%s""",
            (
                "Welcome to ARGUS",
                "Synthetic corpus loaded. Ask the canary question to see the critic.",
                "info",
                "investigator@example.com",
            ),
        )

    conn.commit()
    print(f"CANARY_CASE_ID={CANARY_CASE_ID}")
    print(f"CANARY_QUESTION={CANARY_QUESTION}")
    with conn.cursor() as cur:
        for table in ("stations", "locations", "officers", "cases", "person_refs", "incidents", "users"):
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            print(f"{table}: {cur.fetchone()[0]}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--cases", type=int, default=120)
    args = parser.parse_args()
    conn = connect()
    try:
        if args.reset:
            reset_schema(conn)
        seed(conn, n_cases=args.cases)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
