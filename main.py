from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests
from database import engine, get_db
from models import Base, User, SavedImage
from auth import get_current_user, authenticate_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Image Generator with Auth")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register/")
async def register(username: str, password: str, db: Session = Depends(get_db)):
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
    return {"message": "User created successfully", "user_id": user.id}

@app.post("/login/")
async def login(username: str, password: str, db: Session = Depends(get_db)):
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful", "username": username}

@app.put("/update-password/")
async def update_password(
        current_password: str,
        new_password: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.password != current_password:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    current_user.password = new_password
    db.commit()
    return {"message": "Password updated successfully"}

@app.get("/users/")
async def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "password": user.password,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        for user in users
    ]

@app.get("/generate-image/")
async def generate_image(theme: str):
    url = f"https://image.pollinations.ai/prompt/{theme}"
    response = requests.get(url)
    return Response(content=response.content, media_type="image/png")

@app.post("/save-image/")
async def save_image(
        theme: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    saved_image = SavedImage(
        user_id=current_user.id,
        theme=theme,
        image_url=f"/generate-image/?theme={theme}"
    )
    db.add(saved_image)
    db.commit()
    db.refresh(saved_image)
    return {"message": "Image saved successfully", "image_id": saved_image.id}

@app.get("/saved-images/")
async def get_saved_images(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    saved_images = db.query(SavedImage).filter(SavedImage.user_id == current_user.id).all()
    return [
        {
            "id": img.id,
            "user_id": img.user_id,
            "theme": img.theme,
            "image_url": img.image_url,
            "created_at": img.created_at.isoformat()
        }
        for img in saved_images
    ]

@app.delete("/saved-images/{image_id}")
async def delete_saved_image(
        image_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    image = db.query(SavedImage).filter(
        SavedImage.id == image_id,
        SavedImage.user_id == current_user.id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}

@app.get("/user-info/")
async def get_user_info(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    saved_count = db.query(SavedImage).filter(SavedImage.user_id == current_user.id).count()
    return {
        "username": current_user.username,
        "saved_images_count": saved_count,
        "user_id": current_user.id
    }

@app.get("/")
async def root():
    return {"message": "AI Image Generator"}

