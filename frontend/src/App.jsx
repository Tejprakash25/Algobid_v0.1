import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health")
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus(
          data.status === "ok" ? "Backend Connected ✓" : "Backend Error"
        );
      })
      .catch(() => {
        setBackendStatus("Backend Offline");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold">ALGOBID</h1>
        <p className="mt-3 text-gray-400">The Strategic Coding Game</p>

        <div className="mt-8 px-6 py-3 rounded-lg bg-gray-900">
          {backendStatus}
        </div>
      </div>
    </div>
  );
}

export default App;