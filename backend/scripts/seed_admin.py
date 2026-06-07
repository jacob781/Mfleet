"""
Seed the first admin user from environment variables.

Run from the backend/ directory:
    python -m scripts.seed_admin

Reads ADMIN_EMAIL and ADMIN_PASSWORD. Idempotent: if a user with that email
already exists, it does nothing.
"""

import os

from dotenv import load_dotenv

load_dotenv()

from sqlmodel import Session, select

from database import get_engine
from models import User
from security import hash_password


def main() -> None:
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        raise SystemExit("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.")

    with Session(get_engine()) as session:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            print(f"Admin user already exists: {email}")
            return

        session.add(
            User(
                email=email,
                hashed_password=hash_password(password),
                full_name="Administrator",
                role="admin",
            )
        )
        session.commit()
        print(f"Created admin user: {email}")


if __name__ == "__main__":
    main()
