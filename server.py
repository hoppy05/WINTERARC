from fastapi import FastAPI
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from fastapi.middleware.cors import CORSMiddleware
import os

# --- Create FastAPI app ---
app = FastAPI()

# --- Allow frontend connection ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your Expo/Render frontend link later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MongoDB connection ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://Winterarcuser:hoppy55poppy@cluster0.iczheng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

try:
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    client.admin.command('ping')
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print("❌ MongoDB connection failed:", e)

# --- Define database and collection ---
db = client["winterarc_db"]
users = db["users"]

# --- Root route (check if API works) ---
@app.get("/")
def read_root():
    return {"message": "Winter Arc API - Where discipline is forged in ice"}

# --- Example endpoint to test data saving ---
@app.post("/add_user")
def add_user(data: dict):
    users.insert_one(data)
    return {"message": "User added successfully", "data": data}

# --- Example endpoint to test data fetching ---
@app.get("/get_users")
def get_users():
    return {"users": list(users.find({}, {"_id": 0}))}