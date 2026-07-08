"""compliance: drop stored status column (recomputed from expiry_date)

The live Valid/Expiring Soon/Expired status is always computed on read via
doc_status(expiry_date); the stored column only drifted and was never read.

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-07-08 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, Sequence[str], None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('compliancedocument') as batch:
        batch.drop_column('status')


def downgrade() -> None:
    with op.batch_alter_table('compliancedocument') as batch:
        batch.add_column(sa.Column('status', sa.String(), nullable=False, server_default='Valid'))
