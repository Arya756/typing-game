"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Difficulty } from "@/lib/types";

const DIFFICULTIES: { id: Difficulty; label: string; desc: string; emoji: string }[] = [
  { id: "easy", label: "Easy", desc: "Short & simple facts", emoji: "🟢" },
  { id: "medium", label: "Medium", desc: "Longer sentences", emoji: "🟡" },
  { id: "hard", label: "Hard", desc: "Numbers & punctuation", emoji: "🔴" },
];

export default function HomeClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create race");
      localStorage.setItem(`typerush:${data.code}:playerId`, data.playerId);
      localStorage.setItem(`typerush:${data.code}:name`, name);
      router.push(`/race/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name first.");
      return;
    }
    if (!code.trim()) {
      setError("Enter the room code your friend shared.");
      return;
    }
    setLoading(true);
    setError(null);
    const roomCode = code.trim().toUpperCase();
    try {
      const res = await fetch(`/api/races/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to join race");
      localStorage.setItem(`typerush:${roomCode}:playerId`, data.playerId);
      localStorage.setItem(`typerush:${roomCode}:name`, name);
      router.push(`/race/${roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <div className="mb-3 text-6xl">🏁</div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Type<span className="text-amber-400">Rush</span> Local
          </h1>
          <p className="mt-3 max-w-xl text-balance text-slate-300">
            Race your friend on the couch! Open this page on both Macs, create a room, share the
            code, and see whose fingers are faster — live, side by side.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1">
            <button
              onClick={() => {
                setMode("create");
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === "create" ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:text-white"
              }`}
            >
              🚀 Create Race
            </button>
            <button
              onClick={() => {
                setMode("join");
                setError(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === "join" ? "bg-amber-400 text-slate-900" : "text-slate-300 hover:text-white"
              }`}
            >
              🔑 Join Race
            </button>
          </div>

          <form onSubmit={mode === "create" ? handleCreate : handleJoin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="e.g. Sam"
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {mode === "create" ? (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        difficulty === d.id
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-white/10 bg-slate-900/50 hover:border-white/30"
                      }`}
                    >
                      <div className="text-xl">{d.emoji}</div>
                      <div className="mt-1 text-sm font-semibold">{d.label}</div>
                      <div className="text-[10px] text-slate-400">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Room code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="e.g. 7K2QD"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-white placeholder:tracking-normal placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-400 py-3 text-base font-bold text-slate-900 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {loading
                ? "Please wait…"
                : mode === "create"
                  ? "Create Race 🏎️"
                  : "Join Race 🏁"}
            </button>
          </form>
        </div>

        <ol className="mt-10 grid max-w-2xl grid-cols-1 gap-4 text-sm text-slate-300 sm:grid-cols-3">
          <li className="rounded-xl bg-white/5 p-4">
            <span className="mb-1 block text-lg">1️⃣</span>
            One of you creates a race and picks a difficulty.
          </li>
          <li className="rounded-xl bg-white/5 p-4">
            <span className="mb-1 block text-lg">2️⃣</span>
            Share the room code — your friend joins from their own Mac.
          </li>
          <li className="rounded-xl bg-white/5 p-4">
            <span className="mb-1 block text-lg">3️⃣</span>
            Ready up, countdown hits GO, type fast & accurately to win!
          </li>
        </ol>
      </div>
    </main>
  );
}
