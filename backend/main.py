from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4

app = FastAPI(title="AlgoBid v0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AlgoBid v0.1 backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/game/start")
def start_game():
    game_id = str(uuid4())

    players = [
        {
            "id": "player",
            "name": "You",
            "type": "human",
            "credits": 1000,
        },
        {
            "id": "bot-alpha",
            "name": "Bot Alpha",
            "type": "bot",
            "credits": 1000,
        },
        {
            "id": "bot-beta",
            "name": "Bot Beta",
            "type": "bot",
            "credits": 1000,
        },
        {
            "id": "bot-gamma",
            "name": "Bot Gamma",
            "type": "bot",
            "credits": 1000,
        },
    ]

    return {
        "game_id": game_id,
        "players": players,
        "status": "ready",
    }