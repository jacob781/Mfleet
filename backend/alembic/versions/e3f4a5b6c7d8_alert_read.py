"""alerts: shared read state

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-08-19 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'alertread',
        sa.Column('id', sa.Integer(), primary_key=True),
        # Identity of a computed alert: subject, record, document type and the date it
        # is about — so a renewed document raises a NEW alert instead of inheriting
        # the old one's "read".
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('read_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
    )
    op.create_index('ix_alertread_key', 'alertread', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_alertread_key', table_name='alertread')
    op.drop_table('alertread')
