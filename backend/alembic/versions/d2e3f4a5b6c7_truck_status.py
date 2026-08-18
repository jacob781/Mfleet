"""trucks: status, termination date and an event log (mirrors the driver lifecycle)

Revision ID: d2e3f4a5b6c7
Revises: b4c5d6e7f8a9
Create Date: 2026-08-17 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'b4c5d6e7f8a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('truck', sa.Column(
        'status', sa.String(), nullable=False, server_default='Active',
    ))
    op.add_column('truck', sa.Column('termination_date', sa.Date(), nullable=True))

    op.create_table(
        'truckevent',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('truck_id', sa.Integer(), sa.ForeignKey('truck.id'), nullable=False, index=True),
        sa.Column('kind', sa.String(), nullable=False),   # added | terminated | reactivated
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    # No backfill: unlike a driver, a truck carries no date of joining the fleet, and
    # inventing one would put a false entry in a log meant to be trusted. Existing
    # trucks start with an empty timeline and record events from here on.


def downgrade() -> None:
    op.drop_table('truckevent')
    op.drop_column('truck', 'termination_date')
    op.drop_column('truck', 'status')
