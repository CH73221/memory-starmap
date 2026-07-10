import hashlib
import hmac
import os
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from app.core.config import settings

ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 100_000
SALT_LENGTH = 16


def _hash_password_pbkdf2(password: str, salt: bytes) -> bytes:
    """使用 PBKDF2-HMAC-SHA256 哈希密码。"""
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)


def get_password_hash(password: str) -> str:
    """生成密码哈希，格式：pbkdf2_sha256$iterations$salt_b64$hash_b64"""
    salt = os.urandom(SALT_LENGTH)
    hash_bytes = _hash_password_pbkdf2(password, salt)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(hash_bytes).decode("ascii")
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt_b64}${hash_b64}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码。支持 PBKDF2 格式和 bcrypt 格式。"""
    if hashed_password.startswith("pbkdf2_sha256$"):
        parts = hashed_password.split("$")
        if len(parts) != 4:
            return False
        _, iterations_str, salt_b64, hash_b64 = parts
        try:
            iterations = int(iterations_str)
            salt = base64.b64decode(salt_b64)
            expected_hash = base64.b64decode(hash_b64)
        except (ValueError, base64.binascii.Error):
            return False
        actual_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual_hash, expected_hash)

    # bcrypt 格式 — 直接使用 bcrypt 库（passlib 与 bcrypt 5.x 不兼容）
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$") or hashed_password.startswith("$2y$"):
        try:
            import bcrypt as _bcrypt
            return _bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except Exception:
            return False

    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# 便捷别名，供示例数据等服务使用
hash_password = get_password_hash
