"""telegram: groups, driver links, truck-driver assignment

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-04 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # chat/user ids come from Telegram and overflow a 32-bit integer.
    op.create_table(
        'telegramgroup',
        sa.Column('chat_id', sa.BigInteger(), primary_key=True, autoincrement=False),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('company.id'), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('registered_by', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        'telegramlink',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tg_user_id', sa.BigInteger(), nullable=False, unique=True),
        sa.Column('tg_username', sa.String(), nullable=True),
        sa.Column('tg_name', sa.String(), nullable=True),
        sa.Column('home_chat_id', sa.BigInteger(), nullable=True),
        sa.Column('driver_id', sa.Integer(), sa.ForeignKey('driver.id'), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='linked'),
        sa.Column('claimed_name', sa.String(), nullable=True),
        sa.Column('claimed_dob', sa.Date(), nullable=True),
        sa.Column('claimed_truck', sa.String(), nullable=True),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        'truckdriver',
        sa.Column('truck_id', sa.Integer(), sa.ForeignKey('truck.id'), primary_key=True),
        sa.Column('driver_id', sa.Integer(), sa.ForeignKey('driver.id'), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('truckdriver')
    op.drop_table('telegramlink')
    op.drop_table('telegramgroup')
