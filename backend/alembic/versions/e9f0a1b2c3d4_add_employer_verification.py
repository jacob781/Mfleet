"""add employer_verification (per-employer packet tracking)

Revision ID: e9f0a1b2c3d4
Revises: d8e9f0a1b2c3
Create Date: 2026-06-30 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e9f0a1b2c3d4'
down_revision: Union[str, Sequence[str], None] = 'd8e9f0a1b2c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'employerverification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('employer_index', sa.Integer(), nullable=False),
        sa.Column('employer_name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['application_id'], ['driverapplication.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('application_id', 'employer_index'),
    )
    op.create_index('ix_employerverification_application_id', 'employerverification', ['application_id'])


def downgrade() -> None:
    op.drop_index('ix_employerverification_application_id', table_name='employerverification')
    op.drop_table('employerverification')
