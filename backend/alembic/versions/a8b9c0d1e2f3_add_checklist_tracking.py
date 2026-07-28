"""driver + truck: onboarding checklist tracking

Revision ID: a8b9c0d1e2f3
Revises: f7a8b9c0d1e2
Create Date: 2026-07-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a8b9c0d1e2f3'
down_revision: Union[str, Sequence[str], None] = 'f7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for tbl in ('driver', 'truck'):
        op.add_column(tbl, sa.Column('checklist_checked', sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column(tbl, sa.Column('checklist_date', sa.Date(), nullable=True))


def downgrade() -> None:
    for tbl in ('driver', 'truck'):
        op.drop_column(tbl, 'checklist_date')
        op.drop_column(tbl, 'checklist_checked')
