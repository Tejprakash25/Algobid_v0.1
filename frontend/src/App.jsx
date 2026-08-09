import { useState } from "react";
import Background from "./Background";

function App() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startGame = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/game/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      setGame(data);
    } catch (error) {
      console.error("Failed to start game:", error);

      setError(
        "Unable to start the game. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * LANDING PAGE
   */
  if (!game) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Background />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="text-center">

            <p className="text-xs sm:text-sm tracking-[0.45em] text-emerald-400 font-medium mb-6">
              THE STRATEGIC CODING GAME
            </p>

            <h1 className="text-7xl sm:text-8xl font-black tracking-tight">
              ALGOBID
            </h1>

            <p className="mt-6 text-gray-300 text-lg sm:text-xl max-w-md mx-auto leading-relaxed">
              Don't just solve problems.
              <br />

              <span className="text-white font-semibold">
                Bid for them.
              </span>
            </p>

            <button
              onClick={startGame}
              disabled={loading}
              className="
                mt-10
                px-9
                py-4
                bg-white
                text-black
                font-bold
                rounded-xl
                transition-all
                duration-300
                hover:bg-emerald-400
                hover:scale-105
                active:scale-95
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading
                ? "STARTING..."
                : "PLAY AS GUEST"}
            </button>

            {error && (
              <p className="mt-5 text-sm text-red-400">
                {error}
              </p>
            )}

          </div>
        </main>
      </div>
    );
  }

  /*
   * AUCTION LOBBY
   */
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">

      <Background />

      <main className="relative z-10 min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div
            className="
              flex
              flex-col
              sm:flex-row
              justify-between
              items-start
              sm:items-center
              gap-6
              mb-10
            "
          >

            <div>
              <p className="text-emerald-400 text-sm tracking-[0.3em] font-semibold">
                ALGOBID
              </p>

              <h1 className="text-3xl font-bold mt-1">
                Auction Lobby
              </h1>

              <p className="text-gray-500 text-sm mt-1">
                Game ID: {game.game_id.slice(0, 8)}
              </p>
            </div>

            <div
              className="
                bg-black/50
                backdrop-blur-xl
                border
                border-white/10
                rounded-xl
                px-6
                py-3
              "
            >
              <span className="text-gray-400 text-sm">
                Your Credits
              </span>

              <div className="text-2xl font-bold mt-1">
                💰 1000
              </div>
            </div>

          </div>

          {/* Players */}
          <div
            className="
              bg-black/50
              backdrop-blur-xl
              border
              border-white/10
              rounded-2xl
              p-6
              shadow-2xl
            "
          >

            <div className="flex justify-between items-center mb-7">

              <div>
                <h2 className="text-xl font-bold">
                  Players
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  4 players ready
                </p>
              </div>

              <span className="text-emerald-400 text-sm font-semibold">
                ● READY
              </span>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {game.players.map((player) => (
                <div
                  key={player.id}
                  className="
                    bg-white/[0.03]
                    backdrop-blur-md
                    border
                    border-white/10
                    rounded-xl
                    p-5
                    transition-all
                    duration-300
                    hover:border-emerald-400/40
                    hover:-translate-y-1
                  "
                >

                  <div className="text-2xl mb-3">
                    {player.type === "human"
                      ? "👤"
                      : "🤖"}
                  </div>

                  <h3 className="font-bold">
                    {player.name}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {player.type === "human"
                      ? "You"
                      : "Opponent"}
                  </p>

                  <div className="mt-4 text-emerald-400 font-semibold">
                    💰 {player.credits}
                  </div>

                </div>
              ))}

            </div>

            <div className="mt-9 text-center">

              <button
                className="
                  px-10
                  py-4
                  bg-white
                  text-black
                  font-bold
                  rounded-xl
                  transition-all
                  duration-300
                  hover:bg-emerald-400
                  hover:scale-105
                  active:scale-95
                "
              >
                ENTER AUCTION
              </button>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

export default App;