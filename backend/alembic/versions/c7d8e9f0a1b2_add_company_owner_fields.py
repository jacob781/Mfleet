"""add company owner/principal fields + EIN

Revision ID: c7d8e9f0a1b2
Revises: bb2cb27d6a09
Create Date: 2026-06-30 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, Sequence[str], None] = 'bb2cb27d6a09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # owner_ssn and ein are encrypted at rest (EncryptedString -> Text column).
    op.add_column('company', sa.Column('owner_name', sa.String(), nullable=True))
    op.add_column('company', sa.Column('owner_ssn', sa.Text(), nullable=True))
    op.add_column('company', sa.Column('owner_dob', sa.Date(), nullable=True))
    op.add_column('company', sa.Column('owner_address', sa.String(), nullable=True))
    op.add_column('company', sa.Column('owner_license_no', sa.String(), nullable=True))
    op.add_column('company', sa.Column('owner_license_state', sa.String(), nullable=True))
    op.add_column('company', sa.Column('ein', sa.Text(), nullable=True))


def downgrade() -> None:
    for col in (
        'owner_name', 'owner_ssn', 'owner_dob', 'owner_address',
        'owner_license_no', 'owner_license_state', 'ein',
    ):
        op.drop_column('company', col)
