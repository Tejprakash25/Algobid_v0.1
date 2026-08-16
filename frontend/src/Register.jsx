import { useState } from "react";
import Background from "./Background";

const API_URL = "http://127.0.0.1:8000";

export default function Register({ onBack }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const register = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error || "Unable to create account."
        );
        return;
      }

      setSuccess(
        `Account created successfully. Welcome, ${data.user.username}!`
      );

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to AlgoBid backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="
      relative
      min-h-screen
      overflow-hidden
      bg-black
      text-white
    ">

      <Background />

      <main className="
        relative
        z-10
        min-h-screen
        flex
        items-center
        justify-center
        px-6
      ">

        <section className="
          w-full
          max-w-md
          bg-black/70
          backdrop-blur-xl
          border
          border-emerald-400/20
          rounded-3xl
          p-8
          sm:p-10
        ">

          <div className="text-center">

            <p className="
              text-emerald-400
              text-xs
              tracking-[0.35em]
            ">
              ALGOBID
            </p>

            <h1 className="
              text-3xl
              font-black
              mt-3
            ">
              CREATE ACCOUNT
            </h1>

            <p className="
              text-gray-500
              text-sm
              mt-3
            ">
              Create your AlgoBid identity.
            </p>

          </div>

          <div className="mt-8 space-y-5">

            <div>
              <label className="
                block
                text-xs
                text-gray-500
                mb-2
              ">
                USERNAME
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="your_username"
                maxLength={20}
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-white/[0.05]
                  border
                  border-white/10
                  text-white
                  outline-none
                  focus:border-emerald-400
                  transition-all
                "
              />
            </div>

            <div>
              <label className="
                block
                text-xs
                text-gray-500
                mb-2
              ">
                EMAIL
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                maxLength={100}
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-white/[0.05]
                  border
                  border-white/10
                  text-white
                  outline-none
                  focus:border-emerald-400
                  transition-all
                "
              />
            </div>

            <div>
              <label className="
                block
                text-xs
                text-gray-500
                mb-2
              ">
                PASSWORD
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimum 8 characters"
                maxLength={128}
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-white/[0.05]
                  border
                  border-white/10
                  text-white
                  outline-none
                  focus:border-emerald-400
                  transition-all
                "
              />
            </div>

            <div>
              <label className="
                block
                text-xs
                text-gray-500
                mb-2
              ">
                CONFIRM PASSWORD
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Repeat your password"
                maxLength={128}
                disabled={loading}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  bg-white/[0.05]
                  border
                  border-white/10
                  text-white
                  outline-none
                  focus:border-emerald-400
                  transition-all
                "
              />
            </div>

          </div>

          {error && (
            <div className="
              mt-5
              p-3
              rounded-xl
              bg-red-400/10
              border
              border-red-400/20
              text-red-400
              text-sm
              text-center
            ">
              {error}
            </div>
          )}

          {success && (
            <div className="
              mt-5
              p-3
              rounded-xl
              bg-emerald-400/10
              border
              border-emerald-400/20
              text-emerald-400
              text-sm
              text-center
            ">
              {success}
            </div>
          )}

          <button
            onClick={register}
            disabled={loading}
            className="
              w-full
              mt-7
              px-6
              py-4
              bg-emerald-400
              text-black
              font-black
              rounded-xl
              hover:bg-emerald-300
              hover:scale-[1.02]
              transition-all
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            {loading
              ? "CREATING ACCOUNT..."
              : "CREATE ACCOUNT"}
          </button>

          <button
            onClick={onBack}
            disabled={loading}
            className="
              w-full
              mt-3
              px-6
              py-3
              text-gray-500
              text-sm
              hover:text-white
              transition-all
            "
          >
            ← BACK TO ALGOBID
          </button>

          <p className="
            text-center
            text-[10px]
            text-gray-700
            mt-5
          ">
            LOGIN & PROFILE SYSTEM COMING IN M8-B
          </p>

        </section>

      </main>

    </div>
  );
}