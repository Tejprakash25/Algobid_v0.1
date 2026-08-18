import { useState } from "react";
import Editor from "@monaco-editor/react";
import Background from "./Background";

export default function CodingPage({ problem, onBack }) {
  const [code, setCode] = useState(
`def solution(nums, target):
    # Write your solution here
    pass
`
  );

  const [language, setLanguage] = useState("python");
  const [status, setStatus] = useState("");

  if (!problem) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            No problem selected
          </h1>

          <button
            onClick={onBack}
            className="mt-5 px-6 py-3 rounded-xl bg-emerald-400 text-black font-bold"
          >
            BACK
          </button>
        </div>
      </div>
    );
  }

  const handleRun = () => {
    setStatus(
      "Code execution will be connected to Judge0 in M10."
    );
  };

  const handleSubmit = () => {
    setStatus(
      "Submission engine will be connected to Judge0 in M10."
    );
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      <Background />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="
          h-16
          px-6
          flex
          items-center
          justify-between
          border-b
          border-white/10
          bg-black/60
          backdrop-blur-xl
        ">

          <div>
            <div className="
              text-emerald-400
              text-xs
              tracking-[0.3em]
              font-bold
            ">
              ALGOBID
            </div>

            <div className="text-sm text-gray-500">
              CODING ARENA
            </div>
          </div>

          <div className="flex items-center gap-4">

            <div className="
              px-4
              py-2
              rounded-lg
              bg-white/5
              border
              border-white/10
              text-xs
              text-gray-400
            ">
              PROBLEM ACQUIRED
            </div>

            <button
              onClick={onBack}
              className="
                px-4
                py-2
                rounded-lg
                border
                border-white/10
                text-gray-400
                hover:text-white
                hover:bg-white/5
                transition
              "
            >
              ← BACK
            </button>

          </div>
        </header>

        {/* Main */}
        <main className="
          flex-1
          grid
          grid-cols-1
          lg:grid-cols-[380px_1fr]
          min-h-0
        ">

          {/* Problem panel */}
          <section className="
            border-r
            border-white/10
            bg-black/50
            backdrop-blur-xl
            overflow-y-auto
            p-6
          ">

            <div className="
              text-xs
              tracking-[0.2em]
              text-emerald-400
              font-bold
            ">
              PROBLEM
            </div>

            <h1 className="
              mt-3
              text-2xl
              font-black
            ">
              {problem.title}
            </h1>

            <div className="flex gap-2 mt-4">

              <span className="
                px-3
                py-1
                rounded-full
                bg-white/5
                border
                border-white/10
                text-xs
                text-gray-400
              ">
                {problem.difficulty}
              </span>

              <span className="
                px-3
                py-1
                rounded-full
                bg-emerald-400/10
                border
                border-emerald-400/20
                text-xs
                text-emerald-400
              ">
                {problem.points} POINTS
              </span>

            </div>

            <div className="
              mt-8
              text-gray-300
              leading-7
              text-sm
            ">
              {problem.description}
            </div>

            <div className="
              mt-8
              p-4
              rounded-xl
              bg-white/[0.03]
              border
              border-white/10
            ">

              <div className="
                text-xs
                text-gray-500
                tracking-widest
              ">
                AUCTION COST
              </div>

              <div className="
                mt-2
                text-xl
                font-bold
                text-emerald-400
              ">
                💰 {problem.winning_bid ?? "ACQUIRED"}
              </div>

            </div>

            <div className="
              mt-8
              text-[11px]
              text-gray-600
              leading-5
            ">
              Solve the acquired problem to earn its points.
              <br />
              Judge0 execution will be enabled in M10.
            </div>

          </section>

          {/* Editor */}
          <section className="
            min-h-0
            flex
            flex-col
            bg-[#0a0a0a]/80
          ">

            {/* Editor toolbar */}
            <div className="
              h-14
              px-4
              flex
              items-center
              justify-between
              border-b
              border-white/10
              bg-black/70
            ">

              <div className="flex items-center gap-3">

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value)
                  }
                  className="
                    bg-white/5
                    border
                    border-white/10
                    rounded-lg
                    px-3
                    py-2
                    text-sm
                    text-gray-300
                    outline-none
                  "
                >
                  <option value="python">
                    Python
                  </option>

                  <option value="cpp">
                    C++
                  </option>

                  <option value="java">
                    Java
                  </option>
                </select>

                <span className="
                  text-xs
                  text-gray-600
                ">
                  MONACO EDITOR
                </span>

              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={handleRun}
                  className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-white/10
                    text-gray-300
                    hover:bg-white/5
                    transition
                  "
                >
                  ▶ RUN
                </button>

                <button
                  onClick={handleSubmit}
                  className="
                    px-5
                    py-2
                    rounded-lg
                    bg-emerald-400
                    text-black
                    font-black
                    hover:bg-emerald-300
                    transition
                  "
                >
                  SUBMIT
                </button>

              </div>

            </div>

            {/* Monaco */}
            <div className="flex-1 min-h-0">

              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) =>
                  setCode(value ?? "")
                }
                options={{
                  fontSize: 14,
                  minimap: {
                    enabled: false,
                  },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: {
                    top: 16,
                  },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  tabSize: 4,
                }}
              />

            </div>

            {/* Output */}
            <div className="
              min-h-[90px]
              max-h-[140px]
              border-t
              border-white/10
              bg-black/80
              p-4
              overflow-y-auto
            ">

              <div className="
                text-[10px]
                tracking-[0.2em]
                text-gray-600
                mb-2
              ">
                OUTPUT
              </div>

              {status ? (
                <div className="
                  text-sm
                  text-emerald-400
                ">
                  {status}
                </div>
              ) : (
                <div className="
                  text-sm
                  text-gray-600
                ">
                  Run your code to see output.
                </div>
              )}

            </div>

          </section>

        </main>

      </div>
    </div>
  );
}