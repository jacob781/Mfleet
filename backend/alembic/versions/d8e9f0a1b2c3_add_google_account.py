"""add google_account (Drive OAuth connection, singleton)

Revision ID: d8e9f0a1b2c3
Revises: c7d8e9f0a1b2
Create Date: 2026-06-30 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd8e9f0a1b2c3'
down_revision: Union[str, Sequence[str], None] = 'c7d8e9f0a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'googleaccount',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('account_email', sa.String(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),   # encrypted at rest
        sa.Column('drive_folder_id', sa.String(), nullable=True),
        sa.Column('pending_state', sa.String(), nullable=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('googleaccount')
