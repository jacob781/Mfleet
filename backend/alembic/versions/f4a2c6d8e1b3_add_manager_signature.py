"""add manager counter-signature to driver application

Revision ID: f4a2c6d8e1b3
Revises: e3f1a2b4c5d6
Create Date: 2026-06-09 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f4a2c6d8e1b3'
down_revision: Union[str, Sequence[str], None] = 'e3f1a2b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('driverapplication', sa.Column('manager_signature', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('driverapplication', sa.Column('manager_signed_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('driverapplication', 'manager_signed_at')
    op.drop_column('driverapplication', 'manager_signature')
