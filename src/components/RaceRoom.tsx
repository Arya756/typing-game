"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Difficulty, PlayerData, RaceData } from "@/lib/types";

function prefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function TypingText({ target, typed }: { target: string; typed: string }) {
  const correctLen = prefixLength(typed, target);
  return (
    <p className="select-none font-mono text-lg leading-relaxed tracking-wide sm:text-xl">
      {target.split("").map((char, i) => {
        let className = "text-slate-400";
        if (i < correctLen) {
          className = "text-emerald-400";
        } else if (i < typed.length) {
          className = "bg-rose-500/80 text-white rounded-sm";
        } else if (i === typed.length) {
          className = "text-slate-100 border-b-2 border-amber-400 animate-pulse";
        }
        return (
          <span key={i} className={className}>
            {char}
          </span>
        );
      })}
    </p>
  );
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === 1) return <span>🥇</span>;
  if (rank === 2) return <span>🥈</span>;
  if (rank === 3) return <span>🥉</span>;
  if (rank) return <span>#{rank}</span>;
  return null;
}

export default function RaceRoom({ code }: { code: string }) {
  const [race, setRace] = useState<RaceData | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [typed, setTyped] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy invite link");
  const [restartDifficulty, setRestartDifficulty] = useState<Difficulty>("medium");

  const inputRef = useRef<HTMLInputElement>(null);
  const errorCountRef = useRef(0);
  const clockOffsetRef = useRef(0);
  const lastSentRef = useRef(0);
  const raceTextRef = useRef<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(`typerush:${code}:playerId`);
    if (stored) setPlayerId(stored);
    const storedName = localStorage.getItem(`typerush:${code}:name`);
    if (storedName) setJoinName(storedName);
  }, [code]);

  const fetchRace = useCallback(async () => {
    try {
      const fetchedAt = Date.now();
      const res = await fetch(`/api/races/${code}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data: RaceData = await res.json();
      clockOffsetRef.current = new Date(data.serverNow).getTime() - fetchedAt;
      setRace(data);
      setNotFound(false);
    } catch {
      // transient network hiccup — keep polling
    }
  }, [code]);

  useEffect(() => {
    fetchRace();
    const interval = setInterval(fetchRace, 250);
    return () => clearInterval(interval);
  }, [fetchRace]);

  // Reset typing state whenever a fresh race text starts.
  useEffect(() => {
    if (race && race.raceText !== raceTextRef.current) {
      raceTextRef.current = race.raceText;
      setTyped("");
      errorCountRef.current = 0;
    }
  }, [race]);

  useEffect(() => {
    if (race?.status === "racing") {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [race?.status]);

  const me: PlayerData | undefined = useMemo(
    () => race?.players.find((p) => p.id === playerId),
    [race, playerId],
  );

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinName.trim()) {
      setJoinError("Enter your name first.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/races/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to join race");
      localStorage.setItem(`typerush:${code}:playerId`, data.playerId);
      localStorage.setItem(`typerush:${code}:name`, joinName);
      setPlayerId(data.playerId);
      setRace(data.race);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setJoining(false);
    }
  }

  async function toggleReady() {
    if (!me || !race) return;
    const res = await fetch(`/api/races/${code}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me.id, ready: !me.ready }),
    });
    if (res.ok) setRace(await res.json());
  }

  async function startRace() {
    if (!me) return;
    const res = await fetch(`/api/races/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me.id }),
    });
    if (res.ok) setRace(await res.json());
  }

  async function restartRace() {
    if (!me) return;
    const res = await fetch(`/api/races/${code}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me.id, difficulty: restartDifficulty }),
    });
    if (res.ok) setRace(await res.json());
  }

  const sendProgress = useCallback(
    async (progress: number, errors: number, finished: boolean) => {
      if (!me) return;
      try {
        const res = await fetch(`/api/races/${code}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: me.id, progress, errors, finished }),
        });
        if (res.ok) setRace(await res.json());
      } catch {
        // ignore transient errors; next keystroke/poll will retry
      }
    },
    [code, me],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!race || race.status !== "racing" || !me || me.finishedAt) return;
    const target = race.raceText;
    const value = e.target.value;

    if (value.length > typed.length) {
      const addedIndex = value.length - 1;
      if (value[addedIndex] !== target[addedIndex]) {
        errorCountRef.current += 1;
      }
    }

    const capped = value.slice(0, target.length);
    setTyped(capped);
    const progress = prefixLength(capped, target);
    const finished = progress === target.length;

    const now = Date.now();
    if (finished || now - lastSentRef.current > 120) {
      lastSentRef.current = now;
      sendProgress(progress, errorCountRef.current, finished);
    }
  }

  async function copyInviteLink() {
    const url = `${window.location.origin}/race/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy invite link"), 1800);
    } catch {
      setCopyLabel(url);
    }
  }

  if (notFound) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <p className="text-5xl">🏁</p>
          <h1 className="mt-4 text-2xl font-bold">Race not found</h1>
          <p className="mt-2 text-slate-400">The room code "{code}" doesn&apos;t exist (anymore).</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-900"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!race) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <p className="animate-pulse text-slate-400">Loading race…</p>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-center text-4xl">🏎️</p>
          <h1 className="mt-2 text-center text-xl font-bold">Join race {code}</h1>
          <p className="mt-1 text-center text-sm text-slate-400">
            {race.players.length} racer{race.players.length === 1 ? "" : "s"} already in the
            lobby
          </p>
          <form onSubmit={handleJoin} className="mt-5 space-y-3">
            <input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={20}
              placeholder="Your name"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
            {joinError ? <p className="text-sm text-rose-400">{joinError}</p> : null}
            <button
              type="submit"
              disabled={joining}
              className="w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-900 disabled:opacity-60"
            >
              {joining ? "Joining…" : "Join Race 🏁"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const serverNow = () => Date.now() + clockOffsetRef.current;
  const countdownRemaining =
    race.status === "countdown" && race.startAt
      ? Math.max(0, Math.ceil((new Date(race.startAt).getTime() - serverNow()) / 1000))
      : null;

  const allReady = race.players.length > 0 && race.players.every((p) => p.ready);
  const sortedResults = [...race.players].sort((a, b) => {
    const ra = a.rank ?? 999;
    const rb = b.rank ?? 999;
    return ra - rb;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-lg font-black tracking-tight">
            🏁 Type<span className="text-amber-400">Rush</span>
          </Link>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Room</span>
            <span className="font-mono text-lg font-bold tracking-[0.2em] text-amber-300">
              {code}
            </span>
            <button
              onClick={copyInviteLink}
              className="ml-2 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
            >
              {copyLabel}
            </button>
          </div>
        </header>

        {race.status === "lobby" ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Lobby</h2>
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase text-amber-300">
                {race.difficulty}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Share the room code above with your friend. Everyone must hit Ready, then the host
              starts the race!
            </p>

            <ul className="mt-5 space-y-2">
              {race.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <p className="font-semibold">
                        {p.name} {p.isHost ? <span className="text-xs text-amber-300">(host)</span> : null}
                        {p.id === playerId ? <span className="text-xs text-slate-400"> (you)</span> : null}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      p.ready ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/60 text-slate-300"
                    }`}
                  >
                    {p.ready ? "READY" : "NOT READY"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={toggleReady}
                className={`rounded-xl px-5 py-3 font-bold transition ${
                  me.ready
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                }`}
              >
                {me.ready ? "Cancel Ready" : "I'm Ready ✅"}
              </button>

              {me.isHost ? (
                <button
                  onClick={startRace}
                  disabled={!allReady || race.players.length < 1}
                  className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                  title={!allReady ? "Everyone must be ready" : ""}
                >
                  Start Race 🚦
                </button>
              ) : (
                <p className="text-sm text-slate-400">Waiting for the host to start…</p>
              )}
            </div>
          </section>
        ) : null}

        {race.status === "countdown" || race.status === "racing" ? (
          <section className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-4">
                {race.players.map((p) => {
                  const pct = Math.min(100, (p.progress / race.raceText.length) * 100);
                  return (
                    <div key={p.id}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">
                          {p.name}
                          {p.id === playerId ? " (you)" : ""}
                        </span>
                        <span>
                          {p.wpm} wpm · {p.accuracy}% acc
                          {p.finishedAt ? " · 🏁 finished" : ""}
                        </span>
                      </div>
                      <div className="relative h-10 overflow-hidden rounded-full bg-slate-900/80">
                        <div className="absolute inset-y-0 left-0 right-6 my-auto h-1 rounded bg-white/10" />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-2xl transition-all duration-150 ease-linear"
                          style={{ left: `calc(${pct}% * 0.92)` }}
                        >
                          {p.emoji}
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-lg">🏁</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 p-6">
              {race.status === "countdown" ? (
                <div className="flex min-h-[8rem] flex-col items-center justify-center">
                  <p className="text-sm uppercase tracking-widest text-slate-400">Get ready</p>
                  <p className="text-6xl font-black text-amber-400">
                    {countdownRemaining && countdownRemaining > 0 ? countdownRemaining : "GO!"}
                  </p>
                </div>
              ) : (
                <>
                  <TypingText target={race.raceText} typed={typed} />
                  <input
                    ref={inputRef}
                    value={typed}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()}
                    disabled={!!me.finishedAt}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    className="mt-5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-base text-white outline-none focus:border-amber-400 disabled:opacity-50"
                    placeholder={me.finishedAt ? "You finished! Waiting for others…" : "Start typing here…"}
                  />
                  {me.finishedAt ? (
                    <p className="mt-3 text-center text-emerald-400">
                      🎉 You finished! {race.players.some((p) => !p.finishedAt) ? "Waiting for other racers…" : ""}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </section>
        ) : null}

        {race.status === "finished" ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-center text-2xl font-black">🏆 Race Results</h2>
            <ul className="mt-5 space-y-2">
              {sortedResults.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-xl">
                      <RankBadge rank={p.rank} />
                    </span>
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-semibold">
                      {p.name}
                      {p.id === playerId ? " (you)" : ""}
                    </span>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p className="font-bold text-amber-300">{p.wpm} WPM</p>
                    <p className="text-xs text-slate-400">{p.accuracy}% accuracy</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {me.isHost ? (
                <>
                  <select
                    value={restartDifficulty}
                    onChange={(e) => setRestartDifficulty(e.target.value as Difficulty)}
                    className="rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm font-semibold"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button
                    onClick={restartRace}
                    className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-900 hover:bg-amber-300"
                  >
                    Race Again 🔁
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400">Waiting for the host to start a rematch…</p>
              )}
              <Link
                href="/"
                className="rounded-xl bg-white/10 px-6 py-3 font-bold text-white hover:bg-white/20"
              >
                Back to Home
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
