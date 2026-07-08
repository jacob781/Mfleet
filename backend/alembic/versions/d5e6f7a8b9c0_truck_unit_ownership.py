"""truck: unit_number + ownership

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-07-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('truck', sa.Column('unit_number', sa.String(), nullable=True))
    op.add_column('truck', sa.Column('ownership', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('truck', 'ownership')
    op.drop_column('truck', 'unit_number')
