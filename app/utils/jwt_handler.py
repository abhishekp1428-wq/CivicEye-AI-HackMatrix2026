from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY="civic_ai_secret_key_1217"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data:dict):
    to_encode=data.copy()
    expire=datetime.utcnow()+ timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
    to_encode,
    SECRET_KEY,
    algorithm=ALGORITHM
)

    return encoded_jwt
