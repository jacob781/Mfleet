"""update_level_1_inspection_label

Revision ID: bb2cb27d6a09
Revises: b2c3d4e5f6a7
Create Date: 2026-06-30 12:46:15.083540

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
import crypto


# revision identifiers, used by Alembic.
revision: str = 'bb2cb27d6a09'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Update existing companies and applications to change Level 1 label from 'a complete inspection' to 'a full inspection'."""
    import json
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # 1. Update existing companies
    companies = bind.execute(sa.text("SELECT id, fine_schedule FROM company")).fetchall()
    for company_id, fine_schedule_str in companies:
        if not fine_schedule_str:
            continue
        if isinstance(fine_schedule_str, str):
            try:
                fine_schedule = json.loads(fine_schedule_str)
            except Exception:
                continue
        else:
            fine_schedule = fine_schedule_str

        if not isinstance(fine_schedule, dict):
            continue

        updated = False
        rewards = fine_schedule.get("rewards")
        if isinstance(rewards, dict):
            rows = rewards.get("rows")
            if isinstance(rows, list):
                for row in rows:
                    if isinstance(row, dict) and row.get("label") == "Level 1 – a complete inspection":
                        row["label"] = "Level 1 – a full inspection"
                        updated = True

        if updated:
            payload = json.dumps(fine_schedule)
            if dialect_name == "postgresql":
                bind.execute(
                    sa.text("UPDATE company SET fine_schedule = CAST(:fs AS JSONB) WHERE id = :id"),
                    {"fs": payload, "id": company_id}
                )
            else:
                bind.execute(
                    sa.text("UPDATE company SET fine_schedule = :fs WHERE id = :id"),
                    {"fs": payload, "id": company_id}
                )

    # 2. Update existing driver applications
    applications = bind.execute(sa.text("SELECT id, manager_config FROM driverapplication")).fetchall()
    for app_id, manager_config_str in applications:
        if not manager_config_str:
            continue
        if isinstance(manager_config_str, str):
            try:
                manager_config = json.loads(manager_config_str)
            except Exception:
                continue
        else:
            manager_config = manager_config_str

        if not isinstance(manager_config, dict):
            continue

        updated = False
        fine_schedule = manager_config.get("fine_schedule")
        if isinstance(fine_schedule, dict):
            rewards = fine_schedule.get("rewards")
            if isinstance(rewards, dict):
                rows = rewards.get("rows")
                if isinstance(rows, list):
                    for row in rows:
                        if isinstance(row, dict) and row.get("label") == "Level 1 – a complete inspection":
                            row["label"] = "Level 1 – a full inspection"
                            updated = True

        if updated:
            payload = json.dumps(manager_config)
            if dialect_name == "postgresql":
                bind.execute(
                    sa.text("UPDATE driverapplication SET manager_config = CAST(:mc AS JSONB) WHERE id = :id"),
                    {"mc": payload, "id": app_id}
                )
            else:
                bind.execute(
                    sa.text("UPDATE driverapplication SET manager_config = :mc WHERE id = :id"),
                    {"mc": payload, "id": app_id}
                )


def downgrade() -> None:
    """Downgrade schema: revert Level 1 label back to 'a complete inspection'."""
    import json
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    # 1. Update existing companies
    companies = bind.execute(sa.text("SELECT id, fine_schedule FROM company")).fetchall()
    for company_id, fine_schedule_str in companies:
        if not fine_schedule_str:
            continue
        if isinstance(fine_schedule_str, str):
            try:
                fine_schedule = json.loads(fine_schedule_str)
            except Exception:
                continue
        else:
            fine_schedule = fine_schedule_str

        if not isinstance(fine_schedule, dict):
            continue

        updated = False
        rewards = fine_schedule.get("rewards")
        if isinstance(rewards, dict):
            rows = rewards.get("rows")
            if isinstance(rows, list):
                for row in rows:
                    if isinstance(row, dict) and row.get("label") == "Level 1 – a full inspection":
                        row["label"] = "Level 1 – a complete inspection"
                        updated = True

        if updated:
            payload = json.dumps(fine_schedule)
            if dialect_name == "postgresql":
                bind.execute(
                    sa.text("UPDATE company SET fine_schedule = CAST(:fs AS JSONB) WHERE id = :id"),
                    {"fs": payload, "id": company_id}
                )
            else:
                bind.execute(
                    sa.text("UPDATE company SET fine_schedule = :fs WHERE id = :id"),
                    {"fs": payload, "id": company_id}
                )

    # 2. Update existing driver applications
    applications = bind.execute(sa.text("SELECT id, manager_config FROM driverapplication")).fetchall()
    for app_id, manager_config_str in applications:
        if not manager_config_str:
            continue
        if isinstance(manager_config_str, str):
            try:
                manager_config = json.loads(manager_config_str)
            except Exception:
                continue
        else:
            manager_config = manager_config_str

        if not isinstance(manager_config, dict):
            continue

        updated = False
        fine_schedule = manager_config.get("fine_schedule")
        if isinstance(fine_schedule, dict):
            rewards = fine_schedule.get("rewards")
            if isinstance(rewards, dict):
                rows = rewards.get("rows")
                if isinstance(rows, list):
                    for row in rows:
                        if isinstance(row, dict) and row.get("label") == "Level 1 – a full inspection":
                            row["label"] = "Level 1 – a complete inspection"
                            updated = True

        if updated:
            payload = json.dumps(manager_config)
            if dialect_name == "postgresql":
                bind.execute(
                    sa.text("UPDATE driverapplication SET manager_config = CAST(:mc AS JSONB) WHERE id = :id"),
                    {"mc": payload, "id": app_id}
                )
            else:
                bind.execute(
                    sa.text("UPDATE driverapplication SET manager_config = :mc WHERE id = :id"),
                    {"mc": payload, "id": app_id}
                )
