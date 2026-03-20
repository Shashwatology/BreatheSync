from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Load local environment variables from .env file (if exists)
load_dotenv()

# Import routers
from routes import voice, environment, health, chat

app = FastAPI(
    title="BreathSync Backend",
    description="Backend service for respiratory health voice analysis",
    version="1.0.0"
)

# Configure CORS for local development and potential frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(voice.router)
app.include_router(environment.router)
app.include_router(health.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to BreathSync API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
