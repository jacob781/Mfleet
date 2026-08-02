"""driver termination date

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-08-03

Drivers are terminated instead of deleted, so the date they left is part of the
record. Nullable: everyone on file right now is still employed.
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('driver', sa.Column('termination_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('driver', 'termination_date')
