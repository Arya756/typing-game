import { db } from "@/db";
import { racePlayers, races } from "@/db/schema";
import { FINISH_GRACE_MS } from "@/lib/raceUtils";
import { asc, eq } from "drizzle-orm";

export type RaceRow = typeof races.$inferSelect;
export type PlayerRow = typeof racePlayers.$inferSelect;

export async function loadRace(code: string) {
  const [race] = await db
    .select()
    .from(races)
    .where(eq(races.code, code.toUpperCase()))
    .limit(1);
  if (!race) return null;
  const players = await db
    .select()
    .from(racePlayers)
    .where(eq(racePlayers.raceId, race.id))
    .orderBy(asc(racePlayers.joinedAt));
  return { race, players };
}

/**
 * Applies time-based transitions (countdown -> racing, racing -> finished)
 * lazily whenever the race state is read, and persists any resulting changes.
 */
export async function resolveRaceState(code: string) {
  const loaded = await loadRace(code);
  if (!loaded) return null;
  let { race, players } = loaded;
  const now = Date.now();

  if (race.status === "countdown" && race.startAt) {
    if (now >= race.startAt.getTime()) {
      const [updated] = await db
        .update(races)
        .set({ status: "racing" })
        .where(eq(races.id, race.id))
        .returning();
      race = updated;
    }
  }

  if (race.status === "racing") {
    const finishedPlayers = players.filter((p) => p.finishedAt);
    const allFinished = players.length > 0 && finishedPlayers.length === players.length;
    const earliestFinish = finishedPlayers.reduce<number | null>((min, p) => {
      const t = p.finishedAt!.getTime();
      return min === null || t < min ? t : min;
    }, null);
    const graceExpired = earliestFinish !== null && now - earliestFinish > FINISH_GRACE_MS;

    if (allFinished || graceExpired) {
      // Auto-finish anyone still racing (DNF) using their current progress.
      let nextRank = finishedPlayers.length;
      const updatedPlayers: PlayerRow[] = [];
      for (const p of players) {
        if (!p.finishedAt) {
          nextRank += 1;
          const [updated] = await db
            .update(racePlayers)
            .set({ finishedAt: new Date(now), rank: nextRank })
            .where(eq(racePlayers.id, p.id))
            .returning();
          updatedPlayers.push(updated);
        } else {
          updatedPlayers.push(p);
        }
      }
      players = updatedPlayers;
      const [updatedRace] = await db
        .update(races)
        .set({ status: "finished", finishedAt: new Date(now) })
        .where(eq(races.id, race.id))
        .returning();
      race = updatedRace;
    }
  }

  return { race, players };
}

export function serializeRace(race: RaceRow, players: PlayerRow[]) {
  return {
    code: race.code,
    status: race.status,
    difficulty: race.difficulty,
    raceText: race.raceText,
    startAt: race.startAt ? race.startAt.toISOString() : null,
    finishedAt: race.finishedAt ? race.finishedAt.toISOString() : null,
    serverNow: new Date().toISOString(),
    players: players
      .slice()
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        emoji: p.emoji,
        isHost: p.isHost,
        ready: p.ready,
        progress: p.progress,
        errors: p.errors,
        wpm: p.wpm,
        accuracy: p.accuracy,
        finishedAt: p.finishedAt ? p.finishedAt.toISOString() : null,
        rank: p.rank,
      })),
  };
}
