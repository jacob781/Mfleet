"""add per-company fine schedule (Schedule A penalties)

Revision ID: a1b2c3d4e5f6
Revises: f4a2c6d8e1b3
Create Date: 2026-06-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f4a2c6d8e1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema and backfill existing companies with the standard schedule."""
    op.add_column('company', sa.Column('fine_schedule', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Seed existing companies so their penalty table is populated and editable.
    import json
    from fine_schedule import default_fine_schedule

    bind = op.get_bind()
    payload = json.dumps(default_fine_schedule())
    bind.execute(
        sa.text("UPDATE company SET fine_schedule = CAST(:fs AS JSONB) WHERE fine_schedule IS NULL"),
        {"fs": payload},
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('company', 'fine_schedule')
