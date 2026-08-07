# AlgoBid v0.1 Prototype

A lightning-fast strategic coding game prototype. Bid your currency, solve the problem, top the leaderboard.

## Features Completed (v0.1)
- [x] Guest mode (No DB required)
- [x] Live Problem Auction (10s timer)
- [x] In-memory bot intelligence (Ada, Alan, Grace bid dynamically)
- [x] Coding mechanic (Time limits + simulated evaluation)
- [x] Real-time leaderboard scoring

## Quick Start (Local)
1. **Backend**: 
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload