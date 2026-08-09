from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4

PROBLEMS = [
    {
        "id": 1,
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": "Find two numbers in an array that add up to a given target.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 2,
        "title": "Valid Parentheses",
        "difficulty": "Easy",
        "description": "Determine whether a string of brackets is valid.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 3,
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Medium",
        "description": "Find the maximum profit from buying and selling a stock.",
        "base_price": 200,
        "points": 1500,
    },
]

games = {}

app = FastAPI(title="AlgoBid v0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def bot_bid(game):
    current_bid = game["current_bid"]

    bots = [
        {
            "id": "bot-alpha",
            "max_bid": 250,
        },
        {
            "id": "bot-beta",
            "max_bid": 350,
        },
        {
            "id": "bot-gamma",
            "max_bid": 200,
        },
    ]

    eligible_bots = []

    for bot_config in bots:
        bot = next(
            (
                p for p in game["players"]
                if p["id"] == bot_config["id"]
            ),
            None
        )

        if not bot:
            continue

        next_bid = current_bid + 50

        if (
            next_bid <= bot_config["max_bid"]
            and next_bid <= bot["credits"]
        ):
            eligible_bots.append(
                {
                    "bot": bot,
                    "next_bid": next_bid,
                }
            )

    if not eligible_bots:
        return None

    # Pick one eligible bot
    selected = eligible_bots[0]

    bot = selected["bot"]
    next_bid = selected["next_bid"]

    game["current_bid"] = next_bid
    game["current_leader"] = bot["id"]

    return {
        "id": bot["id"],
        "name": bot["name"],
        "bid": next_bid,
    }


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
            "score": 0,
        },
        {
            "id": "bot-alpha",
            "name": "Bot Alpha",
            "type": "bot",
            "credits": 1000,
            "score": 0,
        },
        {
            "id": "bot-beta",
            "name": "Bot Beta",
            "type": "bot",
            "credits": 1000,
            "score": 0,
        },
        {
            "id": "bot-gamma",
            "name": "Bot Gamma",
            "type": "bot",
            "credits": 1000,
            "score": 0,
        },
    ]

    games[game_id] = {
        "game_id": game_id,
        "players": players,
        "round": 1,
        "current_problem_index": 0,
        "current_bid": PROBLEMS[0]["base_price"],
        "current_leader": None,
        "status": "lobby",
    }

    return games[game_id]

@app.post("/api/game/{game_id}/auction/start")
def start_auction(game_id: str):
    game = games.get(game_id)

    if not game:
        return {"error": "Game not found"}

    problem = PROBLEMS[game["current_problem_index"]]

    game["status"] = "auction"
    game["current_bid"] = problem["base_price"]
    game["current_leader"] = None

    return {
        "game_id": game_id,
        "round": game["round"],
        "problem": problem,
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "status": game["status"],
    }

@app.post("/api/game/{game_id}/bid")
def place_bid(game_id: str, amount: int):
    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found"
        }

    if game["status"] != "auction":
        return {
            "success": False,
            "error": "Auction is not active"
        }

    player = next(
        (
            p for p in game["players"]
            if p["id"] == "player"
        ),
        None
    )

    if not player:
        return {
            "success": False,
            "error": "Player not found"
        }

    if amount <= game["current_bid"]:
        return {
            "success": False,
            "error": f"Bid must be greater than {game['current_bid']}"
        }

    if amount > player["credits"]:
        return {
            "success": False,
            "error": "Insufficient credits"
        }

    # Human player's bid
    game["current_bid"] = amount
    game["current_leader"] = "player"

    # Give bots a chance to respond
    bot_result = bot_bid(game)

    return {
        "success": True,
        "game_id": game_id,
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "player_credits": player["credits"],
        "bot_response": bot_result,
        "status": game["status"]
    }

@app.post("/api/game/{game_id}/auction/finalize")
def finalize_auction(game_id: str):
    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found"
        }

    if game["status"] != "auction":
        return {
            "success": False,
            "error": "Auction is not active"
        }

    if game["current_leader"] is None:
        return {
            "success": False,
            "error": "No bids have been placed"
        }

    winner = next(
        (
            p for p in game["players"]
            if p["id"] == game["current_leader"]
        ),
        None
    )

    if not winner:
        return {
            "success": False,
            "error": "Winner not found"
        }

    problem = PROBLEMS[game["current_problem_index"]]

    winning_bid = game["current_bid"]

    if winning_bid > winner["credits"]:
        return {
            "success": False,
            "error": "Winner does not have enough credits"
        }

    # Deduct winning bid
    winner["credits"] -= winning_bid

    # Award points
    winner["score"] += problem["points"]

    # Mark auction as completed
    game["status"] = "completed"

    return {
        "success": True,
        "game_id": game_id,
        "winner": {
            "id": winner["id"],
            "name": winner["name"],
            "type": winner["type"]
        },
        "problem": problem,
        "winning_bid": winning_bid,
        "remaining_credits": winner["credits"],
        "score": winner["score"],
        "status": game["status"]
    }