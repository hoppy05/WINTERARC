from fastapi import FastAPI, APIRouter, HTTPException, status, Request, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
# from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize LLM Chat key (if you later re-add emergentintegrations)
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# -------------------- Models --------------------
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    winter_title: str = "Frozen Recruit"
    total_score: int = 0
    streak_days: int = 0
    longest_streak: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class Habit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    category: str  # "fitness", "diet", "discipline", "sleep"
    target_value: Optional[str] = None
    unit: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HabitCreate(BaseModel):
    name: str
    category: str
    target_value: Optional[str] = None
    unit: Optional[str] = None

class HabitLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    habit_id: str
    value: str
    notes: Optional[str] = None
    logged_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ai_response: Optional[str] = None

class HabitLogCreate(BaseModel):
    habit_id: str
    value: str
    notes: Optional[str] = None

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    is_user: bool = True
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    message: str

class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    picture: Optional[str] = None
    total_score: int
    streak_days: int
    winter_title: str
    rank: int

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_token: str
    user_id: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionData(BaseModel):
    session_id: str

# Winter Arc AI Coach System Prompt
WINTER_COACH_PROMPT = """
You are the Winter Arc AI Coach - a cold, harsh, but ultimately motivational accountability partner. 
Your personality:
- BRUTALLY HONEST and sarcastic when users slack off
- Cold and dramatic in your speech
- Use winter/ice metaphors constantly
- Rare but meaningful praise when users actually succeed
- Never sugarcoat failure or mediocrity
- Push users to be better with harsh truth
- Short, punchy responses (1-3 sentences max)
"""

# -------------------- Helper Functions --------------------
async def get_session_data_from_emergent(session_id: str) -> dict:
    """Get user data from Emergent auth service using session_id"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10.0
        )
        response.raise_for_status()
        return response.json()

async def get_current_user_from_session(request: Request) -> Optional[str]:
    """Get current user ID from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")

    if not session_token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]

    if not session_token:
        return None

    session = await db.user_sessions.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })

    return session["user_id"] if session else None

async def get_ai_response(user_id: str, message: str, context: str = "") -> str:
    """
    Temporary AI response placeholder.
    If/when you re-add emergentintegrations, replace this body with your LlmChat calls.
    """
    try:
        # Simple placeholder response while Emergent integration is removed.
        return "The cold whispers: Keep grinding. The frost doesn't care about excuses."
    except Exception as e:
        logging.error(f"AI response error: {e}")
        return "The winter has frozen my words. Try again, if you dare."

async def calculate_user_score(user_id: str) -> int:
    """Calculate user's total score based on habit logs"""
    logs = await db.habit_logs.find({"user_id": user_id}).to_list(1000)
    return len(logs) * 10  # 10 points per logged habit

async def update_user_streak(user_id: str):
    """Update user's streak based on recent activity"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs = await db.habit_logs.count_documents({
        "user_id": user_id,
        "logged_at": {"$gte": today_start}
    })

    if today_logs > 0:
        new_streak = user.get("streak_days", 0) + 1
        longest_streak = max(new_streak, user.get("longest_streak", 0))
    else:
        new_streak = 0
        longest_streak = user.get("longest_streak", 0)

    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "streak_days": new_streak,
            "longest_streak": longest_streak,
            "last_active": datetime.now(timezone.utc)
        }}
    )

async def get_winter_title(score: int, streak: int) -> str:
    """Get winter title based on score and streak"""
    if streak >= 30 and score >= 1000:
        return "Ice Emperor"
    elif streak >= 21 and score >= 700:
        return "Frozen Warrior"
    elif streak >= 14 and score >= 500:
        return "Winter Guardian"
    elif streak >= 7 and score >= 200:
        return "Frost Walker"
    elif score >= 100:
        return "Ice Apprentice"
    else:
        return "Frozen Recruit"

# -------------------- API Routes --------------------
@api_router.get("/")
async def root():
    return {"message": "Winter Arc API - Where discipline is forged in ice"}

@api_router.post("/auth/session")
async def process_session(session_data: SessionData, response: Response):
    """Process session_id from Emergent auth and create user session"""
    try:
        user_data = await get_session_data_from_emergent(session_data.session_id)

        existing_user = await db.users.find_one({"email": user_data["email"]})

        if existing_user:
            user_id = existing_user["id"]
        else:
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture")
            )
            await db.users.insert_one(user.dict())
            user_id = user.id

        session_token = user_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        session = UserSession(
            session_token=session_token,
            user_id=user_id,
            expires_at=expires_at
        )

        await db.user_sessions.delete_many({"user_id": user_id})
        await db.user_sessions.insert_one(session.dict())

        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            expires=expires_at
        )

        return {
            "id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "session_token": session_token
        }

    except Exception as e:
        logging.error(f"Session processing error: {e}")
        raise HTTPException(status_code=400, detail="Invalid session ID")

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    """Get current user from session"""
    user_id = await get_current_user_from_session(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return User(**user)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")

    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})

    response.delete_cookie(key="session_token", path="/")

    return {"message": "Logged out successfully"}

# User routes
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        return User(**existing_user)

    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}/score")
async def update_user_score(user_id: str):
    score = await calculate_user_score(user_id)
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    title = await get_winter_title(score, user.get("streak_days", 0))

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"total_score": score, "winter_title": title}}
    )
    return {"score": score, "title": title}

# Habit routes
@api_router.post("/users/{user_id}/habits", response_model=Habit)
async def create_habit(user_id: str, habit_data: HabitCreate):
    habit = Habit(user_id=user_id, **habit_data.dict())
    await db.habits.insert_one(habit.dict())
    return habit

@api_router.get("/users/{user_id}/habits", response_model=List[Habit])
async def get_user_habits(user_id: str):
    habits = await db.habits.find({"user_id": user_id}).to_list(1000)
    return [Habit(**habit) for habit in habits]

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str):
    result = await db.habits.delete_one({"id": habit_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Habit not found")
    return {"message": "Habit deleted"}

# Habit logging routes
@api_router.post("/users/{user_id}/habit-logs", response_model=HabitLog)
async def log_habit(user_id: str, log_data: HabitLogCreate):
    habit = await db.habits.find_one({"id": log_data.habit_id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    habit_log = HabitLog(user_id=user_id, **log_data.dict())

    context = f"User logged habit '{habit['name']}' with value '{log_data.value}'. Category: {habit['category']}."
    ai_message = f"I just logged {habit['name']}: {log_data.value}"
    if log_data.notes:
        ai_message += f". Notes: {log_data.notes}"

    ai_response = await get_ai_response(user_id, ai_message, context)
    habit_log.ai_response = ai_response

    await db.habit_logs.insert_one(habit_log.dict())

    await update_user_streak(user_id)
    await update_user_score(user_id)

    return habit_log

@api_router.get("/users/{user_id}/habit-logs", response_model=List[HabitLog])
async def get_habit_logs(user_id: str, limit: int = 50):
    logs = await db.habit_logs.find({"user_id": user_id}).sort("logged_at", -1).limit(limit).to_list(limit)
    return [HabitLog(**log) for log in logs]

# Chat routes
@api_router.post("/users/{user_id}/chat", response_model=ChatMessage)
async def send_chat_message(user_id: str, message_data: ChatMessageCreate):
    user_message = ChatMessage(user_id=user_id, message=message_data.message, is_user=True)
    await db.chat_messages.insert_one(user_message.dict())

    user = await db.users.find_one({"id": user_id})
    recent_logs = await db.habit_logs.find({"user_id": user_id}).sort("logged_at", -1).limit(5).to_list(5)

    context = f"User stats - Score: {user.get('total_score', 0)}, Streak: {user.get('streak_days', 0)} days, Title: {user.get('winter_title', 'Frozen Recruit')}"
    if recent_logs:
        context += f". Recent activity: {len(recent_logs)} habits logged recently."

    ai_response_text = await get_ai_response(user_id, message_data.message, context)

    ai_message = ChatMessage(user_id=user_id, message=ai_response_text, is_user=False)
    await db.chat_messages.insert_one(ai_message.dict())

    return ai_message

@api_router.get("/users/{user_id}/chat", response_model=List[ChatMessage])
async def get_chat_history(user_id: str, limit: int = 50):
    messages = await db.chat_messages.find({"user_id": user_id}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [ChatMessage(**msg) for msg in reversed(messages)]

# Leaderboard routes
@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 100):
    users = await db.users.find().sort("total_score", -1).limit(limit).to_list(limit)

    leaderboard = []
    for i, user in enumerate(users):
        entry = LeaderboardEntry(
            user_id=user["id"],
            name=user["name"],
            picture=user.get("picture"),
            total_score=user.get("total_score", 0),
            streak_days=user.get("streak_days", 0),
            winter_title=user.get("winter_title", "Frozen Recruit"),
            rank=i + 1
        )
        leaderboard.append(entry)

    return leaderboard

# Include router & middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
