"""truck: owner_driver_id (owner-operator link)

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-07-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('truck', sa.Column('owner_driver_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_truck_owner_driver', 'truck', 'driver', ['owner_driver_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_truck_owner_driver', 'truck', type_='foreignkey')
    op.drop_column('truck', 'owner_driver_id')
