"""employer verification: attempts log + received_at

Revision ID: f0a1b2c3d4e5
Revises: e9f0a1b2c3d4
Create Date: 2026-06-30 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'f0a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = 'e9f0a1b2c3d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('employerverification', sa.Column(
        'attempts', postgresql.JSONB(astext_type=sa.Text()),
        nullable=False, server_default='[]'))
    op.add_column('employerverification', sa.Column(
        'received_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('employerverification', 'received_at')
    op.drop_column('employerverification', 'attempts')
