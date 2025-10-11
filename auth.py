from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User

security = HTTPBearer()

def create_user(db: Session, username: str, password: str):
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=username,
        password=password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if user and user.password == password:
        return user
    return None

def get_current_user(db: Session = Depends(get_db), token: str = Depends(security)):
    username = token.credentials
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user