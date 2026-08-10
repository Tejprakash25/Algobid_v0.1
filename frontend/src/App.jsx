import { useState } from "react";
import Background from "./Background";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [game, setGame] = useState(null);
  const [auction, setAuction] = useState(null);

  const [loading, setLoading] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [bidAmount, setBidAmount] = useState(150);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // M4-A : CREATE GAME
  // --------------------------------------------------

  const startGame = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/game/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();

      setGame(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to start game. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // M4-B : START AUCTION
  // --------------------------------------------------

  const startAuction = async () => {
    if (!game) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/game/${game.game_id}/auction/start`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start auction");
      }

      const data = await response.json();

      setAuction(data);

      setBidAmount(data.current_bid + 50);
    } catch (err) {
      console.error(err);
      setError("Unable to start auction.");
    }
  };

  // --------------------------------------------------
  // M4-B : PLACE BID
  // --------------------------------------------------

  const placeBid = async () => {
    if (bidding || !auction || !game) return;

    setBidding(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/game/${game.game_id}/bid?amount=${bidAmount}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setAuction((previous) => ({
        ...previous,
        current_bid: data.current_bid,
        current_leader: data.current_leader,
        bot_response: data.bot_response,
      }));

      setBidAmount(data.current_bid + 50);
    } catch (err) {
      console.error(err);
      setError("Bid failed.");
    } finally {
      setBidding(false);
    }
  };

  // --------------------------------------------------
  // M4-C : FINALIZE AUCTION
  // --------------------------------------------------

  const finalizeAuction = async () => {
    if (finalizing || !auction || !game) return;

    setFinalizing(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/game/${game.game_id}/auction/finalize`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setAuction((previous) => ({
        ...previous,
        result: data,
      }));
    } catch (err) {
      console.error(err);
      setError("Unable to finalize auction.");
    } finally {
      setFinalizing(false);
    }
  };

  // --------------------------------------------------
  // PLAY AGAIN
  // --------------------------------------------------

  const playAgain = () => {
    setGame(null);
    setAuction(null);
    setError("");
    setBidAmount(150);
  };

  // ==================================================
  // LANDING PAGE
  // ==================================================

  if (!game) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Background />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="text-center">

            <p className="text-sm tracking-[0.45em] text-emerald-400 mb-5">
              THE STRATEGIC CODING GAME
            </p>

            <h1 className="text-7xl sm:text-8xl font-black tracking-tight">
              ALGOBID
            </h1>

            <p className="mt-5 text-gray-300 text-lg">
              Don't just solve problems.
              <br />

              <span className="font-semibold text-white">
                Bid for them.
              </span>
            </p>

            <button
              onClick={startGame}
              disabled={loading}
              className="
                mt-10
                px-9 py-4
                bg-white text-black
                font-bold
                rounded-xl
                transition-all duration-300
                hover:bg-emerald-400
                hover:scale-105
                active:scale-95
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {loading
                ? "CREATING GAME..."
                : "PLAY AS GUEST"}
            </button>

            {error && (
              <p className="mt-5 text-red-400 text-sm">
                {error}
              </p>
            )}

          </div>
        </main>
      </div>
    );
  }

  // ==================================================
  // MAIN GAME
  // ==================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Background />

      <main className="relative z-10 min-h-screen px-6 py-10">

        <div className="max-w-5xl mx-auto">

          {/* ==================================================
              HEADER
          ================================================== */}

          <header className="flex flex-col sm:flex-row justify-between gap-5 items-start sm:items-center mb-10">

            <div>
              <p className="text-emerald-400 text-sm tracking-[0.3em]">
                ALGOBID
              </p>

              <h1 className="text-3xl font-bold">
                {auction
                  ? "Live Auction"
                  : "Auction Lobby"}
              </h1>
            </div>

            <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3">

              <p className="text-gray-400 text-sm">
                Credits
              </p>

              <p className="text-2xl font-bold">
                💰 1000
              </p>

            </div>

          </header>

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {error && (
            <div className="mb-6 border border-red-500/30 bg-red-500/10 rounded-xl px-5 py-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ==================================================
              M4-A : LOBBY
          ================================================== */}

          {!auction && (
            <section className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">

              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-7">

                <div>
                  <h2 className="text-xl font-bold">
                    Players
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Game ID:{" "}
                    {game.game_id.slice(0, 8)}
                  </p>
                </div>

                <span className="text-emerald-400 text-sm">
                  ● READY
                </span>

              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {game.players.map((player) => (
                  <div
                    key={player.id}
                    className="
                      bg-white/[0.03]
                      border border-white/10
                      rounded-xl
                      p-5
                      transition-all duration-300
                      hover:border-emerald-400/30
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

                    <p className="text-gray-500 text-sm">
                      {player.type === "human"
                        ? "You"
                        : "Opponent"}
                    </p>

                    <p className="mt-4 text-emerald-400 font-semibold">
                      💰 {player.credits}
                    </p>

                  </div>
                ))}

              </div>

              <div className="text-center mt-9">

                <button
                  onClick={startAuction}
                  className="
                    px-10 py-4
                    bg-white text-black
                    font-bold
                    rounded-xl
                    transition-all duration-300
                    hover:bg-emerald-400
                    hover:scale-105
                    active:scale-95
                  "
                >
                  ENTER AUCTION
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              M4-B : AUCTION SCREEN
          ================================================== */}

          {auction && !auction.result && (
            <section className="
              bg-black/60
              backdrop-blur-xl
              border border-emerald-400/20
              rounded-2xl
              p-6 sm:p-8
            ">

              {/* Round */}

              <div className="text-center">

                <p className="text-emerald-400 text-sm tracking-[0.3em]">
                  ROUND {auction.round}
                </p>

                <h2 className="text-4xl sm:text-5xl font-black mt-3">
                  {auction.problem.title}
                </h2>

                <p className="text-gray-400 mt-3 max-w-xl mx-auto">
                  {auction.problem.description}
                </p>

              </div>

              {/* Problem information */}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">

                  <p className="text-gray-500 text-xs">
                    DIFFICULTY
                  </p>

                  <p className="font-bold mt-2">
                    {auction.problem.difficulty}
                  </p>

                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">

                  <p className="text-gray-500 text-xs">
                    BASE PRICE
                  </p>

                  <p className="font-bold mt-2">
                    💰 {auction.problem.base_price}
                  </p>

                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center col-span-2 sm:col-span-1">

                  <p className="text-gray-500 text-xs">
                    POINTS
                  </p>

                  <p className="font-bold mt-2 text-emerald-400">
                    +{auction.problem.points}
                  </p>

                </div>

              </div>

              {/* Current bid */}

              <div className="text-center mt-10">

                <p className="text-gray-500 text-sm tracking-wider">
                  CURRENT BID
                </p>

                <p className="text-5xl sm:text-6xl font-black text-emerald-400 mt-2">
                  💰 {auction.current_bid}
                </p>

                <p className="mt-5 text-gray-400">
                  Leader:{" "}

                  <span className="text-white font-semibold">
                    {auction.current_leader || "No bids"}
                  </span>
                </p>

              </div>

              {/* Bot response */}

              {auction.bot_response && (
                <div className="mt-5 text-center">

                  <span className="
                    inline-block
                    px-4 py-2
                    rounded-full
                    bg-yellow-400/10
                    border border-yellow-400/20
                    text-yellow-400
                    text-sm
                  ">
                    🤖 {auction.bot_response.name} bid{" "}
                    {auction.bot_response.bid}
                  </span>

                </div>
              )}

              {/* Controls */}

              <div className="
                flex
                flex-col
                sm:flex-row
                justify-center
                gap-4
                mt-9
              ">

                <button
                  onClick={placeBid}
                  disabled={bidding}
                  className="
                    px-8 py-4
                    bg-emerald-400
                    text-black
                    font-bold
                    rounded-xl
                    transition-all duration-300
                    hover:bg-emerald-300
                    hover:scale-105
                    active:scale-95
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {bidding
                    ? "BIDDING..."
                    : `BID 💰 ${bidAmount}`}
                </button>

                <button
                  onClick={finalizeAuction}
                  disabled={finalizing}
                  className="
                    px-8 py-4
                    border border-white/20
                    rounded-xl
                    font-bold
                    transition-all duration-300
                    hover:bg-white/10
                    hover:border-white/30
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  {finalizing
                    ? "FINALIZING..."
                    : "END AUCTION"}
                </button>

              </div>

              <p className="text-center text-gray-600 text-xs mt-5">
                Every bid must be higher than the current bid.
              </p>

            </section>
          )}

          {/* ==================================================
              M4-C : AUCTION RESULT
          ================================================== */}

          {auction?.result && (
            <section className="
              bg-black/70
              backdrop-blur-xl
              border border-emerald-400/30
              rounded-2xl
              p-8 sm:p-10
              text-center
            ">

              <p className="text-emerald-400 text-sm tracking-[0.3em]">
                AUCTION COMPLETE
              </p>

              <h2 className="text-4xl sm:text-5xl font-black mt-4">
                🏆 {auction.result.winner.name}
              </h2>

              <p className="text-gray-400 mt-3">
                won the problem
              </p>

              {/* Result cards */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">

                  <p className="text-gray-500 text-sm">
                    WINNING BID
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    💰 {auction.result.winning_bid}
                  </p>

                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">

                  <p className="text-gray-500 text-sm">
                    POINTS
                  </p>

                  <p className="text-2xl font-bold mt-2 text-emerald-400">
                    +{auction.result.problem.points}
                  </p>

                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">

                  <p className="text-gray-500 text-sm">
                    REMAINING
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    💰 {auction.result.remaining_credits}
                  </p>

                </div>

              </div>

              {/* Play again */}

              <button
                onClick={playAgain}
                className="
                  mt-9
                  px-8 py-3
                  bg-white
                  text-black
                  font-bold
                  rounded-xl
                  transition-all duration-300
                  hover:bg-emerald-400
                  hover:scale-105
                  active:scale-95
                "
              >
                PLAY AGAIN
              </button>

            </section>
          )}

        </div>

      </main>
    </div>
  );
}

export default App;