import sqlite3
import hashlib
import secrets
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "algobid.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
    )

    return f"{salt.hex()}:{password_hash.hex()}"


def create_user(
    username: str,
    email: str,
    password: str,
):
    password_hash = hash_password(password)

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO users
            (username, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (
                username,
                email,
                password_hash,
            ),
        )

        connection.commit()

        return {
            "id": cursor.lastrowid,
            "username": username,
            "email": email,
        }

    except sqlite3.IntegrityError as error:
        message = str(error).lower()

        if "username" in message:
            raise ValueError(
                "Username already exists."
            )

        if "email" in message:
            raise ValueError(
                "Email already registered."
            )

        raise ValueError(
            "Unable to create account."
        )

    finally:
        connection.close()