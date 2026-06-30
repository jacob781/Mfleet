"""employer verification: received_from (reply sender address)

Revision ID: b3c4d5e6f7a8
Revises: f0a1b2c3d4e5
Create Date: 2026-06-30 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'f0a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('employerverification', sa.Column('received_from', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('employerverification', 'received_from')
