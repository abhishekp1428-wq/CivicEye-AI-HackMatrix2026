from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base  
from sqlalchemy.orm import sessionmaker

database_url="mysql+pymysql://root:Test%401234@localhost:3307/civil_ai"
engine=create_engine(database_url)
Sessionlocal=sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine

)
base=declarative_base()
def get_db():
    db=Sessionlocal()# database conection koltaa he
    try:
        yield db # ye connection router ko  tetaaa he
    finally:
        db.close() 

        

