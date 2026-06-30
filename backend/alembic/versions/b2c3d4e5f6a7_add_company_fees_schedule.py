"""add per-company compact fees schedule (FINES AND FEES SCHEDULE)

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add the compact fees schedule column and backfill existing companies."""
    op.add_column('company', sa.Column('fees_schedule', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    import json
    from fine_schedule import default_fees_schedule

    bind = op.get_bind()
    payload = json.dumps(default_fees_schedule())
    bind.execute(
        sa.text("UPDATE company SET fees_schedule = CAST(:fs AS JSONB) WHERE fees_schedule IS NULL"),
        {"fs": payload},
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('company', 'fees_schedule')
