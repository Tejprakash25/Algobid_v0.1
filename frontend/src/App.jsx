import { useEffect, useState } from "react";
import Background from "./Background";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [game, setGame] = useState(null);
  const [auction, setAuction] = useState(null);
  const [result, setResult] = useState(null);
  const [finalGame, setFinalGame] = useState(null);

  const [loading, setLoading] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [recovering, setRecovering] = useState(true);

  const [bidAmount, setBidAmount] = useState(150);
  const [error, setError] = useState("");

  // ==========================================================
  // RECOVER ACTIVE GAME AFTER REFRESH
  // ==========================================================

  useEffect(() => {
    const recoverGame = async () => {
      const savedGameId = localStorage.getItem("algobid_game_id");

      if (!savedGameId) {
        setRecovering(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/game/${savedGameId}`
        );

        if (!response.ok) throw new Error("Game recovery failed");

        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        setGame(data);

        if (data.status === "completed") {
          setFinalGame({
            success: true,
            game_complete: true,
            game_id: data.game_id,
            status: data.status,
            player: data.players.find((p) => p.id === "player"),
            round_history: data.round_history,
          });
        } else if (data.status === "round_complete" && data.round_history?.length) {
          const lastRound =
            data.round_history[data.round_history.length - 1];

          const winner = data.players.find(
            (p) => p.id === lastRound.winner.id
          );

          setResult({
            success: true,
            game_id: data.game_id,
            round: lastRound.round,
            problem: lastRound.problem,
            winner: lastRound.winner,
            winning_bid: lastRound.winning_bid,
            remaining_credits: winner?.credits ?? 0,
            score: winner?.score ?? 0,
            problems_won: winner?.problems_won ?? [],
            status: data.status,
          });
        } else if (data.status === "auction") {
          setAuction({
            success: true,
            game_id: data.game_id,
            round: data.round,
            total_rounds: data.total_rounds,
            problem: data.current_problem,
            current_bid: data.current_bid,
            current_leader: data.current_leader,
            status: data.status,
          });
          setBidAmount(data.current_bid + 50);
        }
      } catch (err) {
        console.warn("Could not recover game:", err);
        localStorage.removeItem("algobid_game_id");
      } finally {
        setRecovering(false);
      }
    };

    recoverGame();
  }, []);

  // ==========================================================
  // START GAME
  // ==========================================================

  const startGame = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const firstTime =
        localStorage.getItem("algobid_has_played") !== "true";

      const response = await fetch(
        `${API_URL}/api/game/start?first_time=${firstTime}`,
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
      localStorage.setItem("algobid_game_id", data.game_id);
      setAuction(null);
      setResult(null);
      setFinalGame(null);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to start game. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // START AUCTION
  // ==========================================================

  const startAuction = async () => {
    if (!game || auctionLoading) return;

    setAuctionLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/game/${game.game_id}/auction/start`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setAuction(data);
      setBidAmount(data.current_bid + 50);
    } catch (err) {
      console.error(err);
      setError("Unable to start auction.");
    } finally {
      setAuctionLoading(false);
    }
  };

  // ==========================================================
  // PLACE BID
  // ==========================================================

  const placeBid = async () => {
    if (bidding || !auction) return;

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

  // ==========================================================
  // FINALIZE AUCTION
  // ==========================================================

  const finalizeAuction = async () => {
    if (finalizing || !auction) return;

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

      setResult(data);

      // Update local player state immediately
      setGame((previous) => {
        if (!previous) return previous;

        const updatedPlayers = previous.players.map(
          (player) => {
            if (player.id === data.winner.id) {
              return {
                ...player,
                credits: data.remaining_credits,
                score: data.score,
                problems_won: data.problems_won,
              };
            }

            return player;
          }
        );

        return {
          ...previous,
          players: updatedPlayers,
          status: "round_complete",
        };
      });
    } catch (err) {
      console.error(err);
      setError("Unable to finalize auction.");
    } finally {
      setFinalizing(false);
    }
  };

  // ==========================================================
  // NEXT ROUND
  // ==========================================================

  const nextRound = async () => {
    if (nextLoading || !game) return;

    setNextLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/game/${game.game_id}/next-round`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      // Game completely finished
      if (data.game_complete) {
        localStorage.setItem("algobid_has_played", "true");
        localStorage.removeItem("algobid_game_id");
        setFinalGame(data);
        setGame((previous) => ({
          ...previous,
          status: "completed",
          players: previous.players.map(
            (player) =>
              player.id === "player"
                ? data.player
                : player
          ),
        }));

        setAuction(null);
        setResult(null);

        return;
      }

      // Next round
      setGame((previous) => ({
        ...previous,
        round: data.round,
        current_problem_index:
          data.round - 1,
        current_problem: data.problem,
        current_bid: data.current_bid,
        current_leader: null,
        status: "lobby",
        players: data.players,
        round_history: data.round_history,
      }));

      setAuction(null);
      setResult(null);
      setBidAmount(data.current_bid + 50);
    } catch (err) {
      console.error(err);
      setError("Unable to start next round.");
    } finally {
      setNextLoading(false);
    }
  };

  // ==========================================================
  // PLAY AGAIN
  // ==========================================================

  const playAgain = () => {
    localStorage.removeItem("algobid_game_id");
    setGame(null);
    setAuction(null);
    setResult(null);
    setFinalGame(null);

    setLoading(false);
    setBidding(false);
    setFinalizing(false);
    setNextLoading(false);
    setAuctionLoading(false);
    setRecovering(false);

    setBidAmount(150);
    setError("");
  };

  // ==========================================================
  // INITIAL RECOVERY SCREEN
  // ==========================================================

  if (recovering) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Background />
        <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-emerald-400 text-sm tracking-[0.4em]">
              ALGOBID
            </p>
            <h1 className="text-3xl font-black mt-4">
              Restoring your game...
            </h1>
            <p className="text-gray-500 mt-3">
              Just a moment.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================
  // LANDING
  // ==========================================================

  if (!game) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Background />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="text-center">

            <p className="text-sm tracking-[0.45em] text-emerald-400 mb-5">
              THE STRATEGIC CODING GAME
            </p>

            <h1 className="text-7xl sm:text-8xl font-black">
              ALGOBID
            </h1>

            <p className="mt-5 text-gray-300 text-lg">
              Don't just solve problems.
              <br />
              <span className="font-semibold text-white">
                Bid for them.
              </span>
            </p>

            <p className="mt-4 text-gray-500 text-sm max-w-md mx-auto">
              Start with 1,000 credits. Compete against three bots.
              Win problems, earn points, and manage your budget.
            </p>

            <button
              onClick={startGame}
              disabled={loading}
              className="
                mt-10
                px-9 py-4
                bg-white text-black
                font-bold rounded-xl
                transition-all duration-300
                hover:bg-emerald-400
                hover:scale-105
                active:scale-95
                disabled:opacity-50
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

  // ==========================================================
  // GAME COMPLETE
  // ==========================================================

  if (finalGame) {
    const player = finalGame.player;

    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Background />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">

          <section className="
            w-full
            max-w-2xl
            bg-black/70
            backdrop-blur-xl
            border border-emerald-400/30
            rounded-3xl
            p-8 sm:p-12
            text-center
          ">

            <p className="text-emerald-400 text-sm tracking-[0.4em]">
              GAME COMPLETE
            </p>

            <h1 className="text-5xl sm:text-6xl font-black mt-5">
              🏆 ALGOBID
            </h1>

            <p className="text-gray-400 mt-4">
              Your first AlgoBid run is complete. Ready for another round?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">

              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <p className="text-gray-500 text-xs">
                  SCORE
                </p>

                <p className="text-3xl font-black text-emerald-400 mt-2">
                  {player.score}
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <p className="text-gray-500 text-xs">
                  CREDITS
                </p>

                <p className="text-3xl font-black mt-2">
                  💰 {player.credits}
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <p className="text-gray-500 text-xs">
                  PROBLEMS WON
                </p>

                <p className="text-3xl font-black mt-2">
                  {player.problems_won.length}
                </p>
              </div>

            </div>

            <button
              onClick={playAgain}
              className="
                mt-10
                px-9 py-4
                bg-white text-black
                font-bold rounded-xl
                hover:bg-emerald-400
                hover:scale-105
                transition-all
              "
            >
              PLAY AGAIN
            </button>

          </section>

        </main>
      </div>
    );
  }

  // ==========================================================
  // MAIN GAME
  // ==========================================================

  const player = game.players.find(
    (p) => p.id === "player"
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Background />

      <main className="relative z-10 min-h-screen px-6 py-10">

        <div className="max-w-5xl mx-auto">

          {/* HEADER */}

          <header className="
            flex
            flex-col
            sm:flex-row
            justify-between
            gap-5
            items-start
            sm:items-center
            mb-10
          ">

            <div>

              <p className="text-emerald-400 text-sm tracking-[0.3em]">
                ALGOBID
              </p>

              <h1 className="text-3xl font-bold">
                {auction
                  ? "Live Auction"
                  : result
                    ? "Round Complete"
                    : "Auction Lobby"}
              </h1>

            </div>

            {/* PLAYER STATS */}

            <div className="flex gap-3">

              <div className="
                bg-black/50
                backdrop-blur-xl
                border border-white/10
                rounded-xl
                px-5 py-3
              ">

                <p className="text-gray-500 text-xs">
                  SCORE
                </p>

                <p className="text-xl font-bold">
                  {player?.score ?? 0}
                </p>

              </div>

              <div className="
                bg-black/50
                backdrop-blur-xl
                border border-white/10
                rounded-xl
                px-5 py-3
              ">

                <p className="text-gray-500 text-xs">
                  CREDITS
                </p>

                <p className="text-xl font-bold">
                  💰 {player?.credits ?? 0}
                </p>

              </div>

            </div>

          </header>

          {/* ROUND INDICATOR */}

          <div className="flex justify-center mb-8">

            <div className="
              px-5 py-2
              rounded-full
              border border-white/10
              bg-white/[0.03]
              text-sm
            ">

              ROUND{" "}
              <span className="text-emerald-400 font-bold">
                {game.round}
              </span>

              {" / "}

              {game.total_rounds}

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="
              mb-6
              border border-red-500/30
              bg-red-500/10
              rounded-xl
              px-5 py-4
              text-red-400
              text-sm
            ">
              {error}
            </div>
          )}

          {/* ==================================================
              LOBBY
          ================================================== */}

          {!auction && !result && (
            <section className="
              bg-black/50
              backdrop-blur-xl
              border border-white/10
              rounded-2xl
              p-6
            ">

              <div className="
                flex
                flex-col
                sm:flex-row
                justify-between
                gap-4
                mb-7
              ">

                <div>

                  <h2 className="text-xl font-bold">
                    Round {game.round}
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

              {/* PLAYERS */}

              <div className="
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-4
              ">

                {game.players.map((player) => (
                  <div
                    key={player.id}
                    className="
                      bg-white/[0.03]
                      border border-white/10
                      rounded-xl
                      p-5
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

                    <p className="mt-1 text-gray-500 text-sm">
                      Score: {player.score}
                    </p>

                  </div>
                ))}

              </div>

              {/* CURRENT PROBLEM */}

              <div className="
                mt-8
                text-center
                bg-white/[0.02]
                border border-white/10
                rounded-xl
                p-6
              ">

                <p className="text-gray-500 text-xs tracking-wider">
                  NEXT PROBLEM
                </p>

                <h2 className="text-2xl font-bold mt-2">
                  {game.current_problem?.title}
                </h2>

                <p className="text-gray-500 text-sm mt-2">
                  Starting bid: 💰{" "}
                  {game.current_problem?.base_price}
                </p>

              </div>

              <div className="text-center mt-8">

                <button
                  onClick={startAuction}
                  disabled={auctionLoading}
                  className="
                    px-10 py-4
                    bg-white text-black
                    font-bold rounded-xl
                    hover:bg-emerald-400
                    hover:scale-105
                    transition-all
                  "
                >
                  {auctionLoading
                    ? "OPENING AUCTION..."
                    : "ENTER AUCTION"}
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              AUCTION
          ================================================== */}

          {auction && !result && (
            <section className="
              bg-black/60
              backdrop-blur-xl
              border border-emerald-400/20
              rounded-2xl
              p-6 sm:p-8
            ">

              <div className="text-center">

                <p className="text-emerald-400 text-sm tracking-[0.3em]">
                  ROUND {auction.round}
                </p>

                <h2 className="
                  text-4xl
                  sm:text-5xl
                  font-black
                  mt-3
                ">
                  {auction.problem.title}
                </h2>

                <p className="
                  text-gray-400
                  mt-3
                  max-w-xl
                  mx-auto
                ">
                  {auction.problem.description}
                </p>

              </div>

              {/* PROBLEM INFO */}

              <div className="
                grid
                grid-cols-2
                sm:grid-cols-3
                gap-4
                mt-8
                max-w-2xl
                mx-auto
              ">

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-4
                  text-center
                ">

                  <p className="text-gray-500 text-xs">
                    DIFFICULTY
                  </p>

                  <p className="font-bold mt-2">
                    {auction.problem.difficulty}
                  </p>

                </div>

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-4
                  text-center
                ">

                  <p className="text-gray-500 text-xs">
                    BASE PRICE
                  </p>

                  <p className="font-bold mt-2">
                    💰 {auction.problem.base_price}
                  </p>

                </div>

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-4
                  text-center
                  col-span-2
                  sm:col-span-1
                ">

                  <p className="text-gray-500 text-xs">
                    POINTS
                  </p>

                  <p className="
                    font-bold
                    mt-2
                    text-emerald-400
                  ">
                    +{auction.problem.points}
                  </p>

                </div>

              </div>

              {/* CURRENT BID */}

              <div className="text-center mt-10">

                <p className="text-gray-500 text-sm tracking-wider">
                  CURRENT BID
                </p>

                <p className="
                  text-5xl
                  sm:text-6xl
                  font-black
                  text-emerald-400
                  mt-2
                ">
                  💰 {auction.current_bid}
                </p>

                <p className="mt-5 text-gray-400">
                  Leader:{" "}

                  <span className="text-white font-semibold">
                    {auction.current_leader
                      ? auction.current_leader === "player"
                        ? "You"
                        : game.players.find(
                            (p) => p.id === auction.current_leader
                          )?.name || auction.current_leader
                      : "No bids"}
                  </span>
                </p>

              </div>

              {/* BOT */}

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
                    🤖{" "}
                    {auction.bot_response.name}
                    {" "}bid{" "}
                    {auction.bot_response.bid}
                  </span>

                </div>
              )}

              <p className="mt-6 text-center text-gray-500 text-sm">
                Each bid must be higher than the current bid. The highest bidder wins when you end the auction.
              </p>

              {/* CONTROLS */}

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
                    hover:bg-emerald-300
                    hover:scale-105
                    transition-all
                    disabled:opacity-50
                  "
                >
                  {bidding
                    ? "BIDDING..."
                    : `BID 💰 ${bidAmount}`}
                </button>

                <button
                  onClick={finalizeAuction}
                  disabled={finalizing || !auction.current_leader}
                  className="
                    px-8 py-4
                    border border-white/20
                    rounded-xl
                    font-bold
                    hover:bg-white/10
                    transition-all
                    disabled:opacity-50
                  "
                >
                  {finalizing
                    ? "FINALIZING..."
                    : "END AUCTION"}
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              ROUND RESULT
          ================================================== */}

          {result && !finalGame && (
            <section className="
              bg-black/70
              backdrop-blur-xl
              border border-emerald-400/30
              rounded-2xl
              p-8 sm:p-10
              text-center
            ">

              <p className="text-emerald-400 text-sm tracking-[0.3em]">
                ROUND {result.round} COMPLETE
              </p>

              <h2 className="
                text-4xl
                sm:text-5xl
                font-black
                mt-4
              ">
                🏆 {result.winner.name}
              </h2>

              <p className="text-gray-400 mt-3">
                won {result.problem.title}
              </p>

              <div className="
                grid
                grid-cols-1
                sm:grid-cols-3
                gap-4
                max-w-2xl
                mx-auto
                mt-8
              ">

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-5
                ">

                  <p className="text-gray-500 text-sm">
                    WINNING BID
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    💰 {result.winning_bid}
                  </p>

                </div>

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-5
                ">

                  <p className="text-gray-500 text-sm">
                    POINTS
                  </p>

                  <p className="
                    text-2xl
                    font-bold
                    mt-2
                    text-emerald-400
                  ">
                    +{result.problem.points}
                  </p>

                </div>

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-5
                ">

                  <p className="text-gray-500 text-sm">
                    YOUR CREDITS
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    💰 {player?.credits ?? 0}
                  </p>

                </div>

              </div>

              <button
                onClick={nextRound}
                disabled={nextLoading}
                className="
                  mt-9
                  px-9 py-4
                  bg-white
                  text-black
                  font-bold
                  rounded-xl
                  hover:bg-emerald-400
                  hover:scale-105
                  transition-all
                  disabled:opacity-50
                "
              >
                {nextLoading
                  ? "LOADING..."
                  : game.round === game.total_rounds
                    ? "VIEW FINAL RESULT"
                    : "NEXT ROUND →"}
              </button>

            </section>
          )}

        </div>

      </main>
    </div>
  );
}

export default App;