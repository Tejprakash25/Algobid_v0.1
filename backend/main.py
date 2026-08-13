from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
import random


# ==========================================================
# APP
# ==========================================================

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


# ==========================================================
# GAME CONSTANTS
# ==========================================================

STARTING_CREDITS = 1000
TOTAL_ROUNDS = 4
BID_INCREMENT = 50


# ==========================================================
# PROBLEMS
# ==========================================================

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
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 3,
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "description": "Find the maximum profit from buying and selling a stock.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 4,
        "title": "Contains Duplicate",
        "difficulty": "Easy",
        "description": "Determine whether an array contains any duplicate values.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 5,
        "title": "Valid Anagram",
        "difficulty": "Easy",
        "description": "Determine whether two strings are anagrams of each other.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 6,
        "title": "Binary Search",
        "difficulty": "Easy",
        "description": "Find the position of a target value in a sorted array.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 7,
        "title": "Reverse String",
        "difficulty": "Easy",
        "description": "Reverse a string in place.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 8,
        "title": "Palindrome Number",
        "difficulty": "Easy",
        "description": "Determine whether an integer reads the same forward and backward.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 9,
        "title": "Fizz Buzz",
        "difficulty": "Easy",
        "description": "Return the Fizz Buzz sequence for integers from 1 through n.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 10,
        "title": "Maximum Subarray",
        "difficulty": "Easy",
        "description": "Find the contiguous subarray with the largest sum.",
        "base_price": 200,
        "points": 1000,
    },
    {
        "id": 11,
        "title": "Climbing Stairs",
        "difficulty": "Easy",
        "description": "Find the number of distinct ways to climb n stairs.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 12,
        "title": "Move Zeroes",
        "difficulty": "Easy",
        "description": "Move all zeroes to the end of an array while preserving order.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 13,
        "title": "Merge Sorted Arrays",
        "difficulty": "Easy",
        "description": "Merge two sorted arrays into one sorted array.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 14,
        "title": "Single Number",
        "difficulty": "Easy",
        "description": "Find the element that appears only once when every other element appears twice.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 15,
        "title": "Majority Element",
        "difficulty": "Easy",
        "description": "Find the element that appears more than half the time in an array.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 16,
        "title": "Length of Last Word",
        "difficulty": "Easy",
        "description": "Find the length of the last word in a string.",
        "base_price": 100,
        "points": 1000,
    },
    {
        "id": 17,
        "title": "Remove Duplicates",
        "difficulty": "Easy",
        "description": "Remove duplicates from a sorted array in place.",
        "base_price": 150,
        "points": 1000,
    },
    {
        "id": 18,
        "title": "Intersection of Two Arrays",
        "difficulty": "Easy",
        "description": "Return the unique intersection of two integer arrays.",
        "base_price": 150,
        "points": 1000,
    },
]


# ==========================================================
# PROBLEM SETS
# ==========================================================

PROBLEM_SETS = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 1, 5],
    [2, 6, 10, 14],
]

INDIAN_BOT_NAMES = [
    "Rohan Patil",
    "Arjun Sharma",
    "Aditya Kulkarni",
    "Sarthak Joshi",
    "Shreyas Deshmukh",
    "Vedant More",
    "Atharva Jadhav",
    "Omkar Shinde",
    "Yash Thakur",
    "Siddharth Pawar",
    "Kunal Verma",
    "Akshay Chavan",
    "Harsh Vaidya",
    "Pranav Kulkarni",
    "Tanmay Bhosale",
    "Nikhil Desai",
    "Aman Gupta",
    "Manav Joshi",
]

# ==========================================================
# BOT CONFIGURATION
# ==========================================================

BOT_CONFIG = [
    {
        "id": "bot-arjun",
        "name": None,
        "style": "aggressive",
        "max_bid": 500,
    },
    {
        "id": "bot-rohan",
        "name": None,
        "style": "balanced",
        "max_bid": 400,
    },
    {
        "id": "bot-aditya",
        "name": None,
        "style": "conservative",
        "max_bid": 300,
    },
]


# ==========================================================
# IN-MEMORY GAME STORAGE
# ==========================================================

games = {}


# ==========================================================
# HELPERS
# ==========================================================

def get_problem(problem_id):
    for problem in PROBLEMS:
        if problem["id"] == problem_id:
            return problem

    return None


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
    return get_problem(
        game["problem_set"][game["current_round"] - 1]
    )


def public_game_state(game):
    return {
        "game_id": game["game_id"],
        "round": game["current_round"],
        "total_rounds": TOTAL_ROUNDS,
        "problem_set": game["problem_set"],
        "current_problem": get_current_problem(game),
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "status": game["status"],
        "players": game["players"],
        "round_history": game["round_history"],
        "first_game": game["first_game"],
        "skipped_bidders": game["skipped_bidders"],
    }


# ==========================================================
# BOT BIDDING
# ==========================================================

def bot_bid(game):
    """
    Determines whether a bot responds to the current human bid.

    M7 intentionally keeps this logic deterministic/simple.
    M7 does NOT introduce artificial delays.
    Frontend timing will be handled later.
    """

    current_bid = game["current_bid"]

    eligible_bots = []

    for config in BOT_CONFIG:
        bot = get_player(game, config["id"])

        if not bot:
            continue

        # A skipped player cannot participate in this auction.
        if bot["id"] in game["skipped_bidders"]:
            continue

        # Don't allow the current leader to bid against itself.
        if game["current_leader"] == bot["id"]:
            continue

        next_bid = current_bid + BID_INCREMENT

        # First-game advantage:
        # bots are intentionally softer during Round 1.
        max_bid = config["max_bid"]

        if game["first_game"] and game["current_round"] == 1:
            max_bid = max(0, max_bid - 100)

        if next_bid <= max_bid and next_bid <= bot["credits"]:
            eligible_bots.append(
                {
                    "bot": bot,
                    "next_bid": next_bid,
                    "style": config["style"],
                }
            )

    if not eligible_bots:
        return None

    # Add slight strategic variation.
    if len(eligible_bots) > 1:
        selected = random.choice(eligible_bots)
    else:
        selected = eligible_bots[0]

    bot = selected["bot"]
    next_bid = selected["next_bid"]

    game["current_bid"] = next_bid
    game["current_leader"] = bot["id"]

    return {
        "id": bot["id"],
        "name": bot["name"],
        "bid": next_bid,
        "style": selected["style"],
    }


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():
    return {
        "message": "AlgoBid v0.1 backend is running"
    }


# ==========================================================
# HEALTH
# ==========================================================

@app.get("/api/health")
def health():
    return {
        "status": "ok"
    }


# ==========================================================
# START GAME
# ==========================================================

@app.post("/api/game/start")
def start_game():
    game_id = str(uuid4())

    # Select one predefined problem set.
    selected_set = random.choice(PROBLEM_SETS)

    # Pick 3 different Indian names for this game.
    selected_names = random.sample(INDIAN_BOT_NAMES, 3)

    players = [
        {
            "id": "player",
            "name": "You",
            "type": "human",
            "credits": STARTING_CREDITS,
            "score": 0,
            "problems_won": [],
        }
    ]

    # Keep existing bot IDs, styles and max-bid behavior.
    # Only the displayed names change every new game.
    for config, name in zip(BOT_CONFIG, selected_names):
        players.append(
            {
                "id": config["id"],
                "name": name,
                "type": "bot",
                "credits": STARTING_CREDITS,
                "score": 0,
                "problems_won": [],
            }
        )

    first_game = True

    games[game_id] = {
        "game_id": game_id,
        "players": players,

        # Number of rounds is controlled by TOTAL_ROUNDS.
        "current_round": 1,
        "total_rounds": TOTAL_ROUNDS,

        # Selected problem set.
        "problem_set": selected_set,

        # Current auction state.
        "current_bid": get_problem(selected_set[0])["base_price"],
        "current_leader": None,

        # Game state.
        "status": "lobby",

        # Acquisition state.
        "acquired_problem": None,
        "acquired_by": None,

        # Players who voluntarily skipped this auction.
        "skipped_bidders": [],

        # Round history.
        "round_history": [],

        # First-game onboarding advantage.
        "first_game": first_game,
    }

    return public_game_state(games[game_id])

# ==========================================================
# START AUCTION
# ==========================================================

@app.post("/api/game/{game_id}/auction/start")
def start_auction(game_id: str):
    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    if game["status"] != "lobby":
        return {
            "success": False,
            "error": "Auction cannot be started right now",
        }

    problem = get_current_problem(game)

    if not problem:
        return {
            "success": False,
            "error": "Problem not found",
        }

    game["status"] = "auction"
    game["current_bid"] = problem["base_price"]
    game["current_leader"] = None

    game["acquired_problem"] = None
    game["acquired_by"] = None

    # Every new problem starts with everyone eligible again.
    game["skipped_bidders"] = []

    return {
        "success": True,
        "game_id": game_id,
        "round": game["current_round"],
        "total_rounds": TOTAL_ROUNDS,
        "problem": problem,
        "current_bid": game["current_bid"],
        "current_leader": None,
        "status": game["status"],
        "players": game["players"],
    }


# ==========================================================
# PLACE BID
# ==========================================================

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

    if "player" in game["skipped_bidders"]:
        return {
            "success": False,
            "error": "You skipped this auction.",
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

    # Human becomes current leader.
    game["current_bid"] = amount
    game["current_leader"] = "player"

    # Give bots a chance to respond.
    bot_result = bot_bid(game)

    return {
        "success": True,
        "game_id": game_id,
        "round": game["current_round"],
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "player_credits": player["credits"],
        "bot_response": bot_result,
        "status": game["status"],
    }

# ==========================================================
# NOT INTERESTED
# ==========================================================

@app.post("/api/game/{game_id}/not-interested")
def not_interested(game_id: str):
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

    # You cannot withdraw after becoming the current leader.
    # You are already winning the problem at this point.
    if game["current_leader"] == "player":
        return {
            "success": False,
            "error": "You are currently leading this auction.",
        }

    if "player" not in game["skipped_bidders"]:
        game["skipped_bidders"].append("player")

    return {
        "success": True,
        "game_id": game_id,
        "skipped": True,
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "players": game["players"],
        "status": game["status"],
        "message": "You are no longer bidding in this auction.",
    }

# ==========================================================
# M7-C — AUCTION TIMER TIMEOUT
# ==========================================================

@app.post("/api/game/{game_id}/bid/timeout")
def bid_timeout(game_id: str):
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

    # A random eligible bot gets the next bid.
    bot_result = bot_bid(game)

    if not bot_result:
        return {
            "success": True,
            "game_id": game_id,
            "timeout": True,
            "bot_response": None,
            "current_bid": game["current_bid"],
            "current_leader": game["current_leader"],
            "message": "No opponent raised the bid.",
            "status": game["status"],
        }

    return {
        "success": True,
        "game_id": game_id,
        "timeout": True,
        "bot_response": bot_result,
        "current_bid": game["current_bid"],
        "current_leader": game["current_leader"],
        "message": f"{bot_result['name']} bid {bot_result['bid']}.",
        "status": game["status"],
    }

# ==========================================================
# FINALIZE AUCTION
# ==========================================================

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
        game["current_leader"]
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

    # ------------------------------------------------------
    # IMPORTANT:
    # Winning the auction does NOT award points.
    # The player only acquires the problem.
    # ------------------------------------------------------

    winner["credits"] -= winning_bid

    acquired_problem = {
        **problem,
        "winning_bid": winning_bid,
        "winner_id": winner["id"],
        "winner_name": winner["name"],
        "solved": False,
        "points_awarded": 0,
        "status": "acquired",
    }

    winner["problems_won"].append(
        problem["id"]
    )

    game["acquired_problem"] = acquired_problem
    game["acquired_by"] = winner["id"]

    game["status"] = "problem_acquired"

    game["round_history"].append(
        {
            "round": game["current_round"],
            "problem_id": problem["id"],
            "problem_title": problem["title"],
            "winner_id": winner["id"],
            "winner_name": winner["name"],
            "winning_bid": winning_bid,
            "points_awarded": 0,
            "status": "acquired",
        }
    )

    return {
        "success": True,
        "game_id": game_id,
        "round": game["current_round"],
        "winner": {
            "id": winner["id"],
            "name": winner["name"],
            "type": winner["type"],
        },
        "problem": problem,
        "winning_bid": winning_bid,
        "remaining_credits": winner["credits"],

        # CRITICAL M7 RULE
        "points_awarded": 0,

        "problem_status": "acquired",
        "status": game["status"],
    }


# ==========================================================
# CURRENT GAME STATE
# ==========================================================

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
        **public_game_state(game),
        "acquired_problem": game["acquired_problem"],
        "acquired_by": game["acquired_by"],
    }


# ==========================================================
# NEXT ROUND
# ==========================================================

@app.post("/api/game/{game_id}/next-round")
def next_round(game_id: str):
    game = games.get(game_id)

    if not game:
        return {
            "success": False,
            "error": "Game not found",
        }

    if game["status"] != "problem_acquired":
        return {
            "success": False,
            "error": (
                "Current round has not been completed "
                "through the acquisition phase"
            ),
        }

    # ------------------------------------------------------
    # M7 only reaches this point after acquisition.
    #
    # M8/M9 will insert the solving/judging phase here.
    # For M7 testing, we allow transition to next round.
    # ------------------------------------------------------

    if game["current_round"] >= TOTAL_ROUNDS:
        game["status"] = "completed"

        player = get_player(game, "player")

        return {
            "success": True,
            "game_complete": True,
            "game_id": game_id,
            "round": game["current_round"],
            "player": player,
            "players": game["players"],
            "round_history": game["round_history"],
            "status": game["status"],
        }

    game["current_round"] += 1

    problem = get_current_problem(game)

    game["current_bid"] = problem["base_price"]
    game["current_leader"] = None

    game["acquired_problem"] = None
    game["acquired_by"] = None

    game["status"] = "lobby"

    return {
        "success": True,
        "game_complete": False,
        "game_id": game_id,
        "round": game["current_round"],
        "total_rounds": TOTAL_ROUNDS,
        "problem": problem,
        "current_bid": problem["base_price"],
        "current_leader": None,
        "players": game["players"],
        "round_history": game["round_history"],
        "status": game["status"],
    }