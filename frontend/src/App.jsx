import React, { useState, useEffect, useRef } from 'react';
import { Play, Gavel, Code, Trophy, Coins, Terminal } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [code, setCode] = useState('def reverse_string(s):\n    return s[::-1]');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws');
    ws.current.onmessage = (event) => setGameState(JSON.parse(event.data));
    return () => ws.current.close();
  }, []);

  const sendAction = (action, payload = {}) => {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, ...payload }));
    }
  };

  if (!gameState) return <div className="min-h-screen text-white flex items-center justify-center font-mono">Connecting to server...</div>;

  const { status, timer, players, bids, current_problem, winner, solution_status } = gameState;
  const guest = players['Guest'];

  return (
    <div className="min-h-screen text-slate-100 font-mono p-4 flex flex-col items-center">
      {/* HUD */}
      <header className="w-full max-w-3xl flex justify-between items-center bg-slate-800 p-4 rounded-lg shadow-lg mb-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
          <Terminal size={24}/> AlgoBid <span className="text-xs text-slate-400 ml-2">v0.1</span>
        </h1>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-yellow-400"><Coins size={20}/> {guest.coins}</div>
          <div className="flex items-center gap-2 text-blue-400"><Trophy size={20}/> {guest.score}</div>
        </div>
      </header>

      {/* Main Arena */}
      <main className="w-full max-w-3xl bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 min-h-[450px] flex flex-col">
        
        {status === 'WAITING' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome to the Arena</h2>
            <p className="text-slate-400 mb-8 max-w-md">3 AI Bots are waiting. Use your coins to bid for DSA problems. High bidders solve the code and earn points. Don't go broke!</p>
            <button onClick={() => sendAction('START_MATCH')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-transform hover:scale-105">
              <Play size={20}/> Start Match
            </button>
          </div>
        )}

        {status === 'AUCTION' && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-orange-400 flex items-center gap-2"><Gavel/> Live Auction</h2>
              <div className="text-3xl font-bold">{timer}s</div>
            </div>
            
            <div className="bg-slate-700 p-4 rounded mb-6 border-l-4 border-emerald-500">
              <h3 className="font-bold text-lg">{current_problem.title}</h3>
              <p className="text-sm text-slate-300 mt-1">{current_problem.description}</p>
              <div className="mt-3 font-bold text-emerald-400">Reward: {current_problem.reward} pts</div>
            </div>

            <div className="flex gap-6 flex-1">
              <div className="flex-1">
                <h4 className="text-slate-400 mb-2 font-semibold uppercase text-sm tracking-wider">Live Bids</h4>
                <div className="space-y-2">
                  {Object.entries(bids).map(([name, amount]) => (
                    <div key={name} className="flex justify-between bg-slate-900 p-3 rounded border border-slate-700">
                      <span>{name}</span>
                      <span className="text-yellow-400 font-bold">{amount} <Coins size={14} className="inline"/></span>
                    </div>
                  ))}
                  {Object.keys(bids).length === 0 && <div className="text-slate-500 text-sm">Waiting for bids...</div>}
                </div>
              </div>
              
              <div className="flex-1 bg-slate-900 p-6 rounded-lg flex flex-col justify-center items-center border border-slate-700">
                <h4 className="mb-4 font-bold">Place Your Bid</h4>
                <input 
                  type="number" 
                  value={bidAmount} 
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Max: 1000" 
                  className="bg-slate-800 border border-slate-600 rounded px-4 py-3 w-full mb-4 text-center text-xl focus:border-emerald-400 outline-none"
                />
                <button 
                  onClick={() => { sendAction('PLACE_BID', { amount: bidAmount }); setBidAmount(''); }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold"
                >
                  Submit Bid
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'CODING' && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Code/> Coding Phase</h2>
              <div className="text-3xl font-bold text-red-400 animate-pulse">{timer}s</div>
            </div>

            <div className="bg-slate-700 p-4 rounded mb-4 flex justify-between items-center">
              <div>
                <span className="text-slate-400">Winner: </span><span className="font-bold text-emerald-400">{winner}</span>
                <span className="text-slate-400 ml-6">Cost: </span><span className="font-bold text-yellow-400">{bids[winner]}</span>
              </div>
            </div>

            {winner === 'Guest' ? (
              <div className="flex-1 flex flex-col">
                <textarea 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 p-4 rounded font-mono text-sm mb-4 outline-none focus:border-emerald-500"
                />
                <button onClick={() => sendAction('SUBMIT_CODE', { code })} className="bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold">
                  Submit Solution
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Terminal size={48} className="mx-auto text-slate-500 mb-4 animate-pulse"/>
                  <p className="text-xl text-slate-300">{winner} is writing code...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'LEADERBOARD' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 flex items-center gap-2"><Trophy/> Match Results</h2>
            <p className="text-slate-300 mb-8">{solution_status}</p>
            
            <div className="w-full max-w-md space-y-3">
              {Object.entries(players).sort((a,b) => b[1].score - a[1].score).map(([name, data], idx) => (
                <div key={name} className="flex justify-between items-center bg-slate-700 p-4 rounded border border-slate-600">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-bold w-4">{idx + 1}.</span>
                    <span className={`font-bold ${name === 'Guest' ? 'text-emerald-400' : 'text-slate-200'}`}>{name}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-yellow-400 flex items-center gap-1 text-sm"><Coins size={14}/> {data.coins}</span>
                    <span className="text-blue-400 flex items-center gap-1 text-sm w-16 justify-end"><Trophy size={14}/> {data.score}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-slate-500">Next match in {timer}s...</div>
          </div>
        )}
      </main>
    </div>
  );
}