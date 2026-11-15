import hashlib
import hmac
import secrets
import time
import unicodedata

PASSWORD_ITERATIONS = 310_000
SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30


def validate_password(password: str) -> str | None:
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if len(password) > 128:
        return "Password must be no more than 128 characters"
    if not any(unicodedata.category(char) == "Lu" for char in password):
        return "Password must include an uppercase letter"
    if not any(unicodedata.category(char) == "Ll" for char in password):
        return "Password must include a lowercase letter"
    if not any(unicodedata.category(char)[0] in {"P", "S"} for char in password):
        return "Password must include a special symbol"
    return None


def hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return salt.hex(), digest.hex()


def verify_password(password: str, salt_hex: str, expected_hex: str) -> bool:
    try:
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(expected_hex)
    except ValueError:
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return hmac.compare_digest(actual, expected)


def create_session_token() -> tuple[str, str, int]:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = int(time.time()) + SESSION_LIFETIME_SECONDS
    return token, token_hash, expires_at


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
