"""compliance documents: keep every version, real issue date, number, address

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-05 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('compliancedocument', sa.Column('document_number', sa.String(), nullable=True))
    op.add_column('compliancedocument', sa.Column('address', sa.String(), nullable=True))
    op.add_column('compliancedocument', sa.Column('superseded_at', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('compliancedocument', 'issue_date', existing_type=sa.Date(), nullable=True)
    # Every existing issue_date is the day the file was uploaded, not the date printed
    # on the document — it was never asked for. Keeping it would date the history
    # wrongly, so clear it and let managers fill in the real ones.
    op.execute("UPDATE compliancedocument SET issue_date = NULL")


def downgrade() -> None:
    op.execute("UPDATE compliancedocument SET issue_date = CURRENT_DATE WHERE issue_date IS NULL")
    op.alter_column('compliancedocument', 'issue_date', existing_type=sa.Date(), nullable=False)
    op.drop_column('compliancedocument', 'superseded_at')
    op.drop_column('compliancedocument', 'address')
    op.drop_column('compliancedocument', 'document_number')
