from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4


# ============================================================
# PROBLEMS
# ============================================================

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


# ============================================================
# GAME STORAGE
# ============================================================

games = {}


# ============================================================
# APP
# ============================================================

app = FastAPI(title="AlgoBid v0.1")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# BOT CONFIGURATION
# ============================================================

BOT_CONFIG = [
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


# ============================================================
# BOT BIDDING
# ============================================================

def bot_bid(game):
    """
    Allows one bot to respond to the player's bid.

    During the player's first game, bots intentionally
    give the guest a realistic opening win.
    """

    # First-time guest protection.
    # Bots do not counter the first auction.
    if game["first_game"] and game["round"] == 1:
        return None

    current_bid = game["current_bid"]

    eligible_bots = []

    for bot_config in BOT_CONFIG:
        bot = next(
            (
                p
                for p in game["players"]
                if p["id"] == bot_config["id"]
            ),
            None,
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

    # Pick the first eligible bot for deterministic MVP behavior.
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


# ============================================================
# HELPERS
# ============================================================

def get_player(game, player_id):
    return next(
        (
            player
            for player in game["players"]
            if player["id"] == player_id
        ),
        None,
    )


def get_current_problem(game):
    return PROBLEMS[game["current_problem_index"]]


def build_game_state(game):
    return {
        "game_id": game["game_id"],
        "round": game["round"],
        "total_rounds": len(PROBLEMS),
        "status": game["status"],
        "first_game": game["first_game"],
        "players": game["players"],
        "current_problem_index": game["current_problem_index"],
        "current_problem": (
            get_current_problem(game)
            if game["current_problem_index"] < len(PROBLEMS)
            else None
        ),
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "round_history": game["round_history"],
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AlgoBid v0.1 backend is running"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok"
    }


# ============================================================
# M5-A
# START GAME
# ============================================================

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
            "problems_won": [],
        },
        {
            "id": "bot-alpha",
            "name": "Bot Alpha",
            "type": "bot",
            "credits": 1000,
            "score": 0,
            "problems_won": [],
        },
        {
            "id": "bot-beta",
            "name": "Bot Beta",
            "type": "bot",
            "credits": 1000,
            "score": 0,
            "problems_won": [],
        },
        {
            "id": "bot-gamma",
            "name": "Bot Gamma",
            "type": "bot",
            "credits": 1000,
            "score": 0,
            "problems_won": [],
        },
    ]

    games[game_id] = {
        "game_id": game_id,
        "players": players,

        # M5 state
        "round": 1,
        "total_rounds": len(PROBLEMS),
        "current_problem_index": 0,

        # Auction state
        "current_bid": PROBLEMS[0]["base_price"],
        "current_leader": None,

        # Game state
        "status": "lobby",

        # First-time guest experience
        "first_game": True,

        # History
        "round_history": [],
    }

    return build_game_state(games[game_id])


# ============================================================
# M5-B
# START AUCTION
# ============================================================

@app.post("/api/game/{game_id}/auction/start")
def start_auction(game_id: str):

    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    if game["status"] == "completed":
        return {
            "success": False,
            "error": "Game is already completed",
        }

    if game["status"] == "auction":
        return {
            "success": False,
            "error": "Auction is already active",
        }

    if game["current_problem_index"] >= len(PROBLEMS):
        return {
            "success": False,
            "error": "No more problems available",
        }

    problem = get_current_problem(game)

    game["status"] = "auction"
    game["current_bid"] = problem["base_price"]
    game["current_leader"] = None

    return {
        "success": True,
        "game_id": game_id,
        "round": game["round"],
        "total_rounds": game["total_rounds"],
        "problem": problem,
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "status": game["status"],
    }


# ============================================================
# M5-B
# PLACE BID
# ============================================================

@app.post("/api/game/{game_id}/bid")
def place_bid(game_id: str, amount: int):

    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    if game["status"] != "auction":
        return {
            "success": False,
            "error": "Auction is not active",
        }

    player = get_player(game, "player")

    if not player:
        return {
            "success": False,
            "error": "Player not found",
        }

    if amount <= game["current_bid"]:
        return {
            "success": False,
            "error": (
                f"Bid must be greater than "
                f"{game['current_bid']}"
            ),
        }

    if amount > player["credits"]:
        return {
            "success": False,
            "error": "Insufficient credits",
        }

    # Human bid
    game["current_bid"] = amount
    game["current_leader"] = "player"

    # Bot response
    bot_result = bot_bid(game)

    return {
        "success": True,
        "game_id": game_id,
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "player_credits": player["credits"],
        "bot_response": bot_result,
        "status": game["status"],
    }


# ============================================================
# M5-A / M5-B
# FINALIZE CURRENT AUCTION
# ============================================================

@app.post("/api/game/{game_id}/auction/finalize")
def finalize_auction(game_id: str):

    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    if game["status"] != "auction":
        return {
            "success": False,
            "error": "Auction is not active",
        }

    if game["current_leader"] is None:
        return {
            "success": False,
            "error": "No bids have been placed",
        }

    winner = get_player(
        game,
        game["current_leader"],
    )

    if not winner:
        return {
            "success": False,
            "error": "Winner not found",
        }

    problem = get_current_problem(game)

    winning_bid = game["current_bid"]

    if winning_bid > winner["credits"]:
        return {
            "success": False,
            "error": "Winner does not have enough credits",
        }

    # --------------------------------------------------------
    # Deduct credits
    # --------------------------------------------------------

    winner["credits"] -= winning_bid

    # --------------------------------------------------------
    # Award score
    # --------------------------------------------------------

    winner["score"] += problem["points"]

    # --------------------------------------------------------
    # Record problem
    # --------------------------------------------------------

    winner["problems_won"].append(problem["id"])

    # --------------------------------------------------------
    # Record round history
    # --------------------------------------------------------

    game["round_history"].append(
        {
            "round": game["round"],
            "problem": problem,
            "winner": {
                "id": winner["id"],
                "name": winner["name"],
                "type": winner["type"],
            },
            "winning_bid": winning_bid,
            "points": problem["points"],
        }
    )

    # --------------------------------------------------------
    # Current round complete
    # --------------------------------------------------------

    game["status"] = "round_complete"

    return {
        "success": True,
        "game_id": game_id,
        "round": game["round"],
        "problem": problem,
        "winner": {
            "id": winner["id"],
            "name": winner["name"],
            "type": winner["type"],
        },
        "winning_bid": winning_bid,
        "remaining_credits": winner["credits"],
        "score": winner["score"],
        "problems_won": winner["problems_won"],
        "status": game["status"],
    }


# ============================================================
# M5-B
# NEXT ROUND
# ============================================================

@app.post("/api/game/{game_id}/next-round")
def next_round(game_id: str):

    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    if game["status"] != "round_complete":
        return {
            "success": False,
            "error": "Current round is not complete",
        }

    next_problem_index = (
        game["current_problem_index"] + 1
    )

    # --------------------------------------------------------
    # No more problems = complete game
    # --------------------------------------------------------

    if next_problem_index >= len(PROBLEMS):

        game["status"] = "completed"

        player = get_player(game, "player")

        return {
            "success": True,
            "game_complete": True,
            "game_id": game_id,
            "status": game["status"],
            "player": player,
            "round_history": game["round_history"],
        }

    # --------------------------------------------------------
    # Move to next round
    # --------------------------------------------------------

    game["current_problem_index"] = next_problem_index
    game["round"] += 1

    next_problem = get_current_problem(game)

    game["current_bid"] = next_problem["base_price"]
    game["current_leader"] = None
    game["status"] = "lobby"

    return {
        "success": True,
        "game_complete": False,
        "game_id": game_id,
        "round": game["round"],
        "total_rounds": game["total_rounds"],
        "problem": next_problem,
        "current_bid": game["current_bid"],
        "status": game["status"],
        "players": game["players"],
        "round_history": game["round_history"],
    }


# ============================================================
# M5-C
# CURRENT GAME STATE
# ============================================================

@app.get("/api/game/{game_id}")
def get_game(game_id: str):

    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    return {
        "success": True,
        **build_game_state(game),
    }