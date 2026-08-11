"""driver: employment event history (hired / terminated / reactivated)

Revision ID: e5f6a7b8c9d0
Revises: c3d4e5f6a7b8
Create Date: 2026-08-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'driveremploymentevent',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('driver_id', sa.Integer(), sa.ForeignKey('driver.id'), nullable=False, index=True),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    # Seed the history from what the two columns already hold, so existing drivers
    # start with a timeline instead of a blank one.
    op.execute("""
        INSERT INTO driveremploymentevent (driver_id, kind, date, note, created_at)
        SELECT id, 'hired', hire_date, 'Backfilled from hire_date', now()
        FROM driver WHERE hire_date IS NOT NULL
    """)
    op.execute("""
        INSERT INTO driveremploymentevent (driver_id, kind, date, note, created_at)
        SELECT id, 'terminated', termination_date, 'Backfilled from termination_date', now()
        FROM driver WHERE termination_date IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_table('driveremploymentevent')
