"""compliance document: issuing state (the state printed on a licence)

Revision ID: a2c4e6f8b1d3
Revises: f6a7b8c9d0e1
Create Date: 2026-08-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2c4e6f8b1d3'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('compliancedocument', sa.Column('issuing_state', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('compliancedocument', 'issuing_state')
