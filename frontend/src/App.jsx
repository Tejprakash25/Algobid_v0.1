import { useEffect, useState } from "react";
import Background from "./Background";

const API_URL = "http://127.0.0.1:8000";

const BOT_IDS = ["bot-arjun", "bot-rohan", "bot-aditya"];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [game, setGame] = useState(null);
  const [auction, setAuction] = useState(null);
  const [result, setResult] = useState(null);
  const [finalGame, setFinalGame] = useState(null);

  const [loading, setLoading] = useState(false);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  const [bidAmount, setBidAmount] = useState(150);
  const [bidTimer, setBidTimer] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [notInterested, setNotInterested] = useState(false);

  const [auctionMessage, setAuctionMessage] = useState("");
  const [thinkingPlayer, setThinkingPlayer] = useState(null);

  const [error, setError] = useState("");

  const handleBidTimeout = async () => {
  if (!auction || bidding || thinkingPlayer !== null) {
    return;
  }

  setTimerActive(false);
  setBidding(true);
  setThinkingPlayer("Opponent");
  setAuctionMessage("Time's up. Someone else is bidding...");

  try {
    const response = await fetch(
      `${API_URL}/api/game/${game.game_id}/bid/timeout`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!data.success) {
  setError(data.error);
  setThinkingPlayer(null);
  setBidTimer(10);
  setTimerActive(true);
  return;
}

        if (!data.bot_response) {
      setThinkingPlayer(null);
      setBidding(false);
      setAuctionMessage(
        "No higher bid. Highest bidder wins."
      );

      await sleep(700);

      await finalizeAuction();

      return;
    }

    const bot = data.bot_response;

    await sleep(900);

    setThinkingPlayer(null);

    setAuction((previous) => ({
      ...previous,
      current_bid: data.current_bid,
      current_leader: data.current_leader,
      bot_response: bot,
    }));

    setBidAmount(data.current_bid + 50);

    setAuctionMessage(
      `${bot.name} bid ${bot.bid}. Your turn.`
    );

    setBidTimer(10);
    setTimerActive(true);

  } catch (err) {
    console.error(err);
    setError("Unable to process timeout bid.");
    setThinkingPlayer(null);
  } finally {
    setBidding(false);
  }
};


  useEffect(() => {
  if (!auction || !timerActive || bidding || thinkingPlayer !== null) {
    return;
  }

  if (bidTimer <= 0) {
    handleBidTimeout();
    return;
  }

  const timer = setTimeout(() => {
    setBidTimer((previous) => previous - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [
  auction,
  timerActive,
  bidTimer,
  bidding,
  thinkingPlayer,
]);

  // ==========================================================
  // START GAME
  // ==========================================================

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
      setAuction(null);
      setResult(null);
      setFinalGame(null);
      setAuctionMessage("");
      setThinkingPlayer(null);
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
    setAuctionMessage("");
    setThinkingPlayer(null);
    setNotInterested(false);

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

setBidTimer(10);
setTimerActive(true);

setAuctionMessage(
  "Auction is open. Place your bid."
);
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
    setTimerActive(false);
    setError("");
    setAuctionMessage("Your bid is being processed...");
    setThinkingPlayer(null);

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
        setAuctionMessage("Your turn.");
        return;
      }

      // Immediately show player's bid.
      setAuction((previous) => ({
        ...previous,
        current_bid: bidAmount,
        current_leader: "player",
        bot_response: null,
      }));

      setAuctionMessage("Your bid is leading.");

      // ------------------------------------------------------
      // No bot response.
      // Player remains leader.
      // ------------------------------------------------------

            if (!data.bot_response) {
        setThinkingPlayer(null);
        setBidding(false);
        setAuctionMessage(
          "No higher bid. You win the problem."
        );

        await sleep(700);

        await finalizeAuction();

        return;
      }

      // ------------------------------------------------------
      // Bot is now "thinking".
      // ------------------------------------------------------

      const bot = data.bot_response;

      setThinkingPlayer(bot.name);
      setAuctionMessage(
        `${bot.name} is thinking...`
      );

      await sleep(1200);

      // ------------------------------------------------------
      // Reveal bot bid.
      // ------------------------------------------------------

      setThinkingPlayer(null);

      setAuction((previous) => ({
        ...previous,
        current_bid: data.current_bid,
        current_leader: data.current_leader,
        bot_response: bot,
      }));

      setAuctionMessage(
        `${bot.name} bid ${bot.bid}. Your turn.`
      );

      setBidAmount(data.current_bid + 50);
      setBidTimer(10);
      setTimerActive(true);
    } catch (err) {
  console.error(err);

  setError("Bid failed.");
  setAuctionMessage("Your turn.");

  setThinkingPlayer(null);
  setBidding(false);
  setBidTimer(10);
  setTimerActive(true);
} finally {
  setBidding(false);
}
  };

    // ==========================================================
  // NOT INTERESTED
  // ==========================================================

  const notInterestedAuction = async () => {
    if (
      !game ||
      !auction ||
      bidding ||
      thinkingPlayer !== null ||
      auction.current_leader === "player" ||
      notInterested
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/game/${game.game_id}/not-interested`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setNotInterested(true);
      setTimerActive(true);
      setAuctionMessage(
        "You skipped this problem. Watch the auction."
      );

      setAuction((previous) => ({
        ...previous,
        current_bid: data.current_bid,
        current_leader: data.current_leader,
      }));
    } catch (err) {
      console.error(err);
      setError("Unable to skip this auction.");
    }
  };

  // ==========================================================
  // FINALIZE AUCTION
  // ==========================================================

  const finalizeAuction = async () => {
    if (finalizing || !auction) return;

    setFinalizing(true);
    setTimerActive(false);
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

      // Update game with new credits.
      setGame((previous) => {
        if (!previous) return previous;

        const updatedPlayers = previous.players.map(
          (player) => {
            if (player.id === data.winner.id) {
              return {
                ...player,
                credits: data.remaining_credits,
                problems_won: [
                  ...(player.problems_won || []),
                  data.problem.id,
                ],
              };
            }

            return player;
          }
        );

        return {
          ...previous,
          players: updatedPlayers,
          status: "problem_acquired",
        };
      });

      setAuctionMessage("");
      setThinkingPlayer(null);
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

      // Game complete.
      if (data.game_complete) {
  console.log("========== GAME COMPLETE PAYLOAD ==========");
  console.log("FULL DATA:", data);
  console.log("PLAYERS:", data.players);
  console.log("ROUND HISTORY:", data.round_history);
  console.log(
    "ROUND HISTORY JSON:",
    JSON.stringify(data.round_history, null, 2)
  );
  console.log("============================================");

  setFinalGame(data);

  setGame((previous) => ({
    ...previous,
    status: "completed",
    players: data.players,
    round_history: data.round_history,
  }));

  setAuction(null);
  setResult(null);
  setTimerActive(false);
  setBidTimer(10);

  return;
}

      // Next round.
      setGame((previous) => ({
        ...previous,
        round: data.round,
        total_rounds: data.total_rounds,
        problem_set: previous.problem_set,
        current_problem: data.problem,
        current_bid: data.current_bid,
        current_leader: null,
        status: "lobby",
        players: data.players,
        round_history: data.round_history,
      }));

      setAuction(null);
      setResult(null);
      setAuctionMessage("");
      setThinkingPlayer(null);
      setNotInterested(false);
      setBidTimer(10);
      setTimerActive(false);
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
    setGame(null);
    setAuction(null);
    setResult(null);
    setFinalGame(null);

    setLoading(false);
    setAuctionLoading(false);
    setBidding(false);
    setFinalizing(false);
    setNextLoading(false);

    setBidAmount(150);
    setBidTimer(10);
    setTimerActive(false);
    setNotInterested(false);
    setAuctionMessage("");
    setThinkingPlayer(null);
    setError("");
  };

  // ==========================================================
  // FIND PLAYER
  // ==========================================================

  const player =
    game?.players?.find(
      (p) => p.id === "player"
    );

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
// GAME COMPLETE — M7-B
// ==========================================================

if (finalGame) {
  const players = finalGame.players || [];
  const roundHistory = finalGame.round_history || [];

  const getPlayerAcquisitions = (playerId) => {
    return roundHistory.filter(
      (round) => round.winner_id === playerId
    );
  };

  const startCoding = () => {
    // M7-D / coding phase will be connected here.
    console.log("START CODING");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">

      <Background />

      <main className="
        relative
        z-10
        min-h-screen
        flex
        items-center
        justify-center
        px-4
        py-10
      ">

        <section className="
          w-full
          max-w-5xl
          bg-black/70
          backdrop-blur-xl
          border
          border-emerald-400/20
          rounded-3xl
          p-6
          sm:p-8
          lg:p-10
        ">

          {/* HEADER */}

          <div className="text-center">

            <div className="
              text-emerald-400
              text-xs
              sm:text-sm
              font-bold
              tracking-[0.35em]
            ">
              GAME COMPLETE
            </div>

            <h1 className="
              text-3xl
              sm:text-5xl
              font-black
              mt-3
            ">
              AUCTION RESULTS
            </h1>

            <p className="
              text-gray-400
              mt-3
            ">
              Every problem has found its owner.
            </p>

          </div>


          {/* PLAYER RESULTS */}

          <div className="mt-8 space-y-4">

            {players.map((player) => {

              const acquisitions =
                getPlayerAcquisitions(player.id);

              return (
                <div
                  key={player.id}
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    p-5
                    transition-all
                    duration-300
                    hover:border-emerald-400/30
                  "
                >

                  <div className="
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    gap-5
                  ">

                    {/* PLAYER */}

                    <div className="lg:w-56 shrink-0">

                      <div className="
                        flex
                        items-center
                        gap-3
                      ">

                        <div className="
                          w-11
                          h-11
                          rounded-full
                          flex
                          items-center
                          justify-center
                          bg-white/[0.05]
                          border
                          border-white/10
                          text-xl
                        ">
                          {player.id === "player"
                            ? "👤"
                            : "🎮"}
                        </div>

                        <div>

                          <h3 className="
                            text-lg
                            font-bold
                          ">
                            {player.name}
                          </h3>

                          <p className="
                            text-[10px]
                            tracking-[0.2em]
                            text-gray-500
                            mt-1
                          ">
                            {player.id === "player"
                              ? "YOU"
                              : "OPPONENT"}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* ACQUIRED PROBLEM */}

                    <div className="flex-1 min-w-0">

                      <p className="
                        text-[10px]
                        tracking-[0.2em]
                        text-gray-500
                        mb-2
                      ">
                        PROBLEM ACQUIRED
                      </p>

                      {acquisitions.length === 0 ? (

                        <div className="
                          rounded-xl
                          border
                          border-white/5
                          bg-black/20
                          px-4
                          py-3
                          text-sm
                          text-gray-600
                        ">
                          No problem acquired
                        </div>

                      ) : (

                        <div className="space-y-2">

                          {acquisitions.map((round) => (

                            <div
                              key={round.round}
                              className="
                                rounded-xl
                                border
                                border-emerald-400/20
                                bg-emerald-400/[0.05]
                                px-4
                                py-3
                              "
                            >

                              <div className="
                                flex
                                flex-col
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                                gap-2
                              ">

                                <div>

                                  <div className="
                                    font-bold
                                    text-white
                                  ">
                                    {round.problem_title}
                                  </div>

                                  <div className="
                                    text-xs
                                    text-gray-500
                                    mt-1
                                  ">
                                    Round {round.round}
                                  </div>

                                </div>

                                <div className="
                                  text-emerald-400
                                  font-bold
                                  text-sm
                                ">
                                  WON FOR 💰 {round.winning_bid}
                                </div>

                              </div>

                            </div>

                          ))}

                        </div>

                      )}

                    </div>


                    {/* CREDITS */}

                    <div className="
                      lg:w-36
                      shrink-0
                      lg:text-right
                    ">

                      <p className="
                        text-[10px]
                        tracking-[0.2em]
                        text-gray-500
                      ">
                        CREDITS LEFT
                      </p>

                      <p className="
                        text-2xl
                        font-black
                        text-emerald-400
                        mt-1
                      ">
                        💰 {player.credits}
                      </p>

                      <p className="
                        text-[10px]
                        text-gray-600
                        mt-1
                      ">
                        of 1000
                      </p>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>


          {/* MESSAGE */}

          <div className="
            mt-8
            rounded-2xl
            border
            border-emerald-400/10
            bg-emerald-400/[0.04]
            px-6
            py-5
            text-center
          ">

            <p className="text-gray-300">
              The auction is over.
            </p>

            <p className="
              text-emerald-400
              font-semibold
              mt-1
            ">
              Now prove you deserved the problem.
            </p>

          </div>


          {/* START CODING */}

          <div className="
            flex
            justify-center
            mt-7
          ">

            <button
              onClick={startCoding}
              className="
                px-10
                py-4
                rounded-xl
                bg-white
                text-black
                font-black
                tracking-wide
                transition-all
                duration-300
                hover:bg-emerald-400
                hover:scale-105
                active:scale-95
              "
            >
              START CODING →
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}



  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Background />

      <main className="relative z-10 min-h-screen px-6 py-10">

        <div className="max-w-6xl mx-auto">

          {/* HEADER */}

          <header className="
            flex
            flex-col
            sm:flex-row
            justify-between
            gap-5
            items-start
            sm:items-center
            mb-8
          ">

            <div>

              <p className="text-emerald-400 text-sm tracking-[0.3em]">
                ALGOBID
              </p>

              <h1 className="text-3xl font-bold">
                {auction
                  ? "Live Auction"
                  : result
                    ? "Problem Acquired"
                    : "Game Lobby"}
              </h1>

            </div>

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
                border border-emerald-400/20
                rounded-xl
                px-5 py-3
              ">

                <p className="text-gray-500 text-xs">
                  CREDITS
                </p>

                <p className="text-xl font-bold text-emerald-400">
                  💰 {player?.credits ?? 0}
                </p>

              </div>

            </div>

          </header>

          {/* ROUND */}

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
                justify-between
                items-center
                mb-7
              ">

                <div>

                  <p className="text-gray-500 text-xs tracking-wider">
                    GAME ROOM
                  </p>

                  <h2 className="text-2xl font-bold mt-1">
                    Round {game.round}
                  </h2>

                </div>

                <span className="
                  text-emerald-400
                  text-sm
                  font-semibold
                ">
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

                {game.players.map((roomPlayer) => {

                  const isYou =
                    roomPlayer.id === "player";

                  return (
                    <div
                      key={roomPlayer.id}
                      className={`
                        relative
                        bg-white/[0.03]
                        border
                        rounded-xl
                        p-5
                        transition-all
                        ${
                          isYou
                            ? "border-emerald-400/40 bg-emerald-400/[0.04]"
                            : "border-white/10"
                        }
                      `}
                    >

                      {isYou && (
                        <span className="
                          absolute
                          top-3
                          right-3
                          text-[10px]
                          text-emerald-400
                          tracking-wider
                        ">
                          YOU
                        </span>
                      )}

                      <div className="text-2xl mb-3">
                        {isYou ? "👤" : "🎮"}
                      </div>

                      <h3 className="font-bold">
                        {roomPlayer.name}
                      </h3>

                      <p className="text-gray-500 text-sm">
                        {isYou
                          ? "Player"
                          : "Opponent"}
                      </p>

                      <p className="mt-4 text-emerald-400 font-semibold">
                        💰 {roomPlayer.credits}
                      </p>

                      <p className="mt-1 text-gray-500 text-sm">
                        Score: {roomPlayer.score}
                      </p>

                    </div>
                  );
                })}

              </div>

              {/* PROBLEM */}

              <div className="
                mt-8
                text-center
                bg-white/[0.02]
                border border-white/10
                rounded-xl
                p-7
              ">

                <p className="text-gray-500 text-xs tracking-wider">
                  NEXT PROBLEM
                </p>

                <h2 className="text-3xl font-black mt-2">
                  {game.current_problem?.title}
                </h2>

                <div className="flex justify-center gap-4 mt-4">

                  <span className="
                    px-3 py-1
                    rounded-full
                    bg-emerald-400/10
                    text-emerald-400
                    text-xs
                  ">
                    {game.current_problem?.difficulty}
                  </span>

                  <span className="
                    px-3 py-1
                    rounded-full
                    bg-white/5
                    text-gray-400
                    text-xs
                  ">
                    START 💰{" "}
                    {game.current_problem?.base_price}
                  </span>

                </div>

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
                    disabled:opacity-50
                  "
                >
                  {auctionLoading
                    ? "OPENING TABLE..."
                    : "ENTER AUCTION"}
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              AUCTION TABLE
          ================================================== */}

          {auction && !result && (

            <section className="
              bg-black/60
              backdrop-blur-xl
              border border-emerald-400/20
              rounded-3xl
              p-6 sm:p-8
            ">

              {/* AUCTION HEADER */}

              <div className="text-center">

                <p className="
                  text-emerald-400
                  text-xs
                  tracking-[0.35em]
                ">
                  LIVE AUCTION
                </p>

                <h2 className="
                  text-4xl
                  sm:text-5xl
                  font-black
                  mt-3
                ">
                  {auction.problem.title}
                </h2>

                <p className="text-gray-400 mt-3">
                  {auction.problem.description}
                </p>

              </div>

              {/* TABLE PLAYERS */}

              <div className="
                grid
                grid-cols-2
                lg:grid-cols-4
                gap-3
                mt-8
              ">

                {game.players.map((roomPlayer) => {

                  const isLeader =
                    auction.current_leader ===
                    roomPlayer.id;

                  const isYou =
                    roomPlayer.id === "player";

                  const isThinking =
                    thinkingPlayer ===
                    roomPlayer.name;

                  return (
                    <div
                      key={roomPlayer.id}
                      className={`
                        rounded-xl
                        border
                        p-4
                        transition-all
                        duration-500
                        ${
                          isLeader
                            ? "border-emerald-400 bg-emerald-400/[0.08] scale-[1.02]"
                            : "border-white/10 bg-white/[0.02]"
                        }
                      `}
                    >

                      <div className="flex justify-between">

                        <span className="text-xl">
                          {isYou ? "👤" : "🎮"}
                        </span>

                        {isLeader && (
                          <span className="
                            text-[9px]
                            text-emerald-400
                            tracking-wider
                          ">
                            LEADING
                          </span>
                        )}

                      </div>

                      <p className="font-bold mt-3">
                        {roomPlayer.name}
                      </p>

                      <p className="text-gray-500 text-xs">
                        {isYou
                          ? "You"
                          : "Opponent"}
                      </p>

                      <p className="text-emerald-400 font-semibold mt-3">
                        💰 {roomPlayer.credits}
                      </p>

                      {isThinking && (
                        <div className="
                          mt-3
                          flex
                          items-center
                          gap-2
                          text-yellow-400
                          text-xs
                        ">
                          <span className="animate-pulse">
                            ●
                          </span>

                          thinking...
                        </div>
                      )}

                    </div>
                  );
                })}

              </div>

              {/* CURRENT BID */}

              <div className="text-center mt-10">

                <p className="
                  text-gray-500
                  text-xs
                  tracking-[0.25em]
                ">
                  CURRENT BID
                </p>

                <p className="
                  text-6xl
                  sm:text-7xl
                  font-black
                  text-emerald-400
                  mt-2
                ">
                  💰 {auction.current_bid}
                </p>

                <p className="mt-4 text-gray-400">

                  {auction.current_leader === "player"
                    ? "You are leading."
                    : auction.current_leader
                      ? `${
                          game.players.find(
                            (p) =>
                              p.id ===
                              auction.current_leader
                          )?.name ||
                          "Opponent"
                        } is leading.`
                      : "No bids yet."}

                </p>

              </div>

              {/* BID TIMER */}

<div className="text-center mt-6">

  <p className="
    text-gray-500
    text-[10px]
    tracking-[0.25em]
  ">
    YOUR TURN
  </p>

  <div className="
    mt-2
    text-4xl
    font-black
    text-white
  ">
    {bidTimer}
  </div>

  <p className="
    mt-1
    text-[9px]
    text-gray-600
    italic
  ">
    No bid? Enjoy solving someone else's problem.
  </p>

</div>

              {/* AUCTION STATUS */}

              <div className="
                mt-7
                flex
                justify-center
              ">

                <div className="
                  px-6 py-3
                  rounded-full
                  bg-white/[0.04]
                  border border-white/10
                  text-sm
                ">

                  {thinkingPlayer ? (
                    <span className="text-yellow-400">
                      ◌ {thinkingPlayer} is thinking...
                    </span>
                  ) : (
                    <span className="text-gray-300">
                      {auctionMessage ||
                        "Your turn."}
                    </span>
                  )}

                </div>

              </div>

              {/* BID CONTROL */}

              <div className="
                mt-8
                max-w-xl
                mx-auto
              ">

                <div className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                ">

                  <input
                    type="number"
                    min={
                      auction.current_bid + 50
                    }
                    max={player?.credits}
                    value={bidAmount}
                    onChange={(e) =>
                      setBidAmount(
                        Number(e.target.value)
                      )
                    }
                    disabled={
  bidding ||
  thinkingPlayer !== null ||
  notInterested
}
                    className="
                      flex-1
                      px-5 py-4
                      bg-white/[0.04]
                      border border-white/10
                      rounded-xl
                      text-white
                      outline-none
                      focus:border-emerald-400/50
                    "
                  />

                  <button
                    onClick={placeBid}
                    disabled={
                      bidding ||
                      thinkingPlayer !== null ||
                      notInterested ||
                      bidAmount <= auction.current_bid ||
                      bidAmount > (player?.credits ?? 0)
                    }
                    className="
                      px-8 py-4
                      bg-emerald-400
                      text-black
                      font-bold
                      rounded-xl
                      hover:bg-emerald-300
                      hover:scale-[1.02]
                      transition-all
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    {bidding
                      ? "PROCESSING..."
                      : `BID 💰 ${bidAmount}`}
                  </button>

                </div>

                <p className="
                  text-center
                  text-gray-600
                  text-xs
                  mt-3
                ">
                  Minimum next bid: 💰{" "}
                  {auction.current_bid + 50}
                </p>

              </div>

                            {/* NOT INTERESTED */}

              <div className="text-center mt-8">

                <button
                  onClick={notInterestedAuction}
                  disabled={
                    notInterested ||
                    bidding ||
                    thinkingPlayer !== null ||
                    auction.current_leader === "player"
                  }
                  className="
                    px-7 py-3
                    border border-white/10
                    text-gray-400
                    rounded-xl
                    text-sm
                    hover:bg-white/5
                    hover:text-white
                    transition-all
                    disabled:opacity-30
                    disabled:cursor-not-allowed
                  "
                >
                  {notInterested
                    ? "NOT INTERESTED ✓"
                    : "NOT INTERESTED"}
                </button>

                <p className="
                  mt-3
                  text-[10px]
                  text-gray-600
                  max-w-md
                  mx-auto
                  leading-relaxed
                ">
                  Please participate in further auctions.
                  Skip them all and you may have no problem left to solve.
                </p>

              </div>
            </section>
          )}

          {/* ==================================================
              PROBLEM ACQUIRED
          ================================================== */}

          {result && !finalGame && (

            <section className="
              bg-black/70
              backdrop-blur-xl
              border border-emerald-400/30
              rounded-3xl
              p-8 sm:p-10
              text-center
            ">

              <p className="
                text-emerald-400
                text-sm
                tracking-[0.3em]
              ">
                PROBLEM ACQUIRED
              </p>

              <h2 className="
                text-4xl
                sm:text-5xl
                font-black
                mt-4
              ">
                {result.winner.name}
              </h2>

              <p className="text-gray-400 mt-3">
                acquired{" "}
                <span className="text-white font-semibold">
                  {result.problem.title}
                </span>
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

                  <p className="text-gray-500 text-xs">
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

                  <p className="text-gray-500 text-xs">
                    POINTS NOW
                  </p>

                  <p className="
                    text-2xl
                    font-bold
                    mt-2
                    text-yellow-400
                  ">
                    0
                  </p>

                  <p className="text-gray-600 text-xs mt-1">
                    Solve the problem to earn points.
                  </p>

                </div>

                <div className="
                  bg-white/[0.03]
                  border border-white/10
                  rounded-xl
                  p-5
                ">

                  <p className="text-gray-500 text-xs">
                    YOUR CREDITS
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    💰{" "}
                    {player?.credits ?? 0}
                  </p>

                </div>

              </div>

              <div className="
                mt-8
                px-5 py-4
                rounded-xl
                bg-emerald-400/[0.05]
                border border-emerald-400/10
              ">

                <p className="text-gray-300 text-sm">
                  The problem is yours.
                </p>

                <p className="
                  text-emerald-400
                  font-semibold
                  mt-1
                ">
                  The coding arena comes next.
                </p>

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