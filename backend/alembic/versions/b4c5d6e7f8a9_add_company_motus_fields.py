"""add company MOTUS lookup fields (owner contact + insurance snapshot)

Revision ID: b4c5d6e7f8a9
Revises: a2c4e6f8b1d3
Create Date: 2026-08-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b4c5d6e7f8a9'
down_revision: Union[str, Sequence[str], None] = 'a2c4e6f8b1d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('company', sa.Column('owner_title', sa.String(), nullable=True))
    op.add_column('company', sa.Column('owner_phone', sa.String(), nullable=True))
    op.add_column('company', sa.Column('owner_email', sa.String(), nullable=True))
    op.add_column('company', sa.Column('insurance_status', sa.String(), nullable=True))
    op.add_column('company', sa.Column('insurance_policy_number', sa.String(), nullable=True))
    op.add_column('company', sa.Column('insurance_effective_date', sa.Date(), nullable=True))
    op.add_column('company', sa.Column('insurance_max_coverage', sa.Float(), nullable=True))
    op.add_column('company', sa.Column('insurance_checked_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    for col in (
        'owner_title', 'owner_phone', 'owner_email',
        'insurance_status', 'insurance_policy_number',
        'insurance_effective_date', 'insurance_max_coverage', 'insurance_checked_at',
    ):
        op.drop_column('company', col)
