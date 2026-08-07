import asyncio
import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# In-memory game state
game_state = {
    "status": "WAITING", # WAITING, AUCTION, CODING, LEADERBOARD
    "timer": 0,
    "players": {
        "Guest": {"coins": 1000, "score": 0, "is_bot": False},
        "Bot_Ada": {"coins": 1000, "score": 0, "is_bot": True},
        "Bot_Alan": {"coins": 1000, "score": 0, "is_bot": True},
        "Bot_Grace": {"coins": 1000, "score": 0, "is_bot": True}
    },
    "bids": {},
    "current_problem": {
        "title": "Reverse a String",
        "description": "Write a function to reverse a string in O(n) time.",
        "reward": 500
    },
    "winner": None,
    "solution_status": ""
}

clients = []

async def broadcast():
    dead_clients = []
    for client in clients:
        try:
            await client.send_text(json.dumps(game_state))
        except:
            dead_clients.append(client)
    for dc in dead_clients:
        clients.remove(dc)

async def game_loop():
    while True:
        if game_state["status"] == "AUCTION":
            # Simple Bot Intelligence
            current_max_bid = max([0] + list(game_state["bids"].values()))
            for p, p_data in game_state["players"].items():
                if p_data["is_bot"] and p_data["coins"] > current_max_bid:
                    if random.random() > 0.6:  # 40% chance to bid every second
                        max_possible = min(p_data["coins"], current_max_bid + 200)
                        if max_possible > current_max_bid:
                            game_state["bids"][p] = random.randint(current_max_bid + 1, max_possible)
            
            game_state["timer"] -= 1
            if game_state["timer"] <= 0:
                if not game_state["bids"]:
                    game_state["status"] = "WAITING"
                else:
                    # Resolve auction
                    highest_bidder = max(game_state["bids"], key=game_state["bids"].get)
                    winning_bid = game_state["bids"][highest_bidder]
                    game_state["winner"] = highest_bidder
                    game_state["players"][highest_bidder]["coins"] -= winning_bid
                    
                    game_state["status"] = "CODING"
                    game_state["timer"] = 15
        
        elif game_state["status"] == "CODING":
            game_state["timer"] -= 1
            winner_data = game_state["players"][game_state["winner"]]
            
            # Bot solves it automatically after a delay
            if winner_data["is_bot"] and game_state["timer"] == 3:
                success = random.random() > 0.2 # 80% success rate
                if success:
                    winner_data["score"] += game_state["current_problem"]["reward"]
                    game_state["solution_status"] = f"{game_state['winner']} solved the problem!"
                else:
                    game_state["solution_status"] = f"{game_state['winner']} failed the test cases."
                
                game_state["status"] = "LEADERBOARD"
                game_state["timer"] = 10

            elif game_state["timer"] <= 0:
                game_state["solution_status"] = "Time's up!"
                game_state["status"] = "LEADERBOARD"
                game_state["timer"] = 10

        elif game_state["status"] == "LEADERBOARD":
            game_state["timer"] -= 1
            if game_state["timer"] <= 0:
                game_state["status"] = "WAITING"
                game_state["bids"] = {}
                game_state["winner"] = None
                game_state["solution_status"] = ""
        
        if len(clients) > 0:
            await broadcast()
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(game_loop())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    await websocket.send_text(json.dumps(game_state))
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg["action"] == "START_MATCH" and game_state["status"] == "WAITING":
                game_state["status"] = "AUCTION"
                game_state["timer"] = 10
                game_state["bids"] = {}
            
            elif msg["action"] == "PLACE_BID" and game_state["status"] == "AUCTION":
                amount = int(msg["amount"])
                if amount <= game_state["players"]["Guest"]["coins"]:
                    game_state["bids"]["Guest"] = amount
            
            elif msg["action"] == "SUBMIT_CODE" and game_state["status"] == "CODING":
                if game_state["winner"] == "Guest":
                    # Trivial v0.1 evaluation
                    code = msg["code"]
                    if "return" in code and len(code) > 10:
                        game_state["players"]["Guest"]["score"] += game_state["current_problem"]["reward"]
                        game_state["solution_status"] = "You solved it successfully!"
                    else:
                        game_state["solution_status"] = "Failed! Code is incorrect or too short."
                    
                    game_state["status"] = "LEADERBOARD"
                    game_state["timer"] = 10
            
            await broadcast()
    except WebSocketDisconnect:
        clients.remove(websocket)