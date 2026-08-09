from passlib.context import  CryptContext

pw_context=CryptContext(
        schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password:str):
    return pw_context.hash(password)
def verify_password(plain_password:str,hashed_password:str):
    return pw_context.verify(
        plain_password,
        hashed_password
    )