import { db } from "@/db";
import { racePlayers, races } from "@/db/schema";
import { pickRandomText, type Difficulty } from "@/lib/raceTexts";
import { loadRace, serializeRace } from "@/lib/raceState";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === "string" ? body.playerId : "";
    const difficulty: Difficulty | undefined = ["easy", "medium", "hard"].includes(
      body?.difficulty,
    )
      ? body.difficulty
      : undefined;

    const loaded = await loadRace(code);
    if (!loaded) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    const { race, players } = loaded;
    const host = players.find((p) => p.isHost);
    if (!host || host.id !== playerId) {
      return Response.json({ error: "Only the host can restart the race" }, { status: 403 });
    }

    const nextDifficulty = difficulty ?? (race.difficulty as Difficulty);
    const raceText = pickRandomText(nextDifficulty);

    const [updatedRace] = await db
      .update(races)
      .set({
        status: "lobby",
        difficulty: nextDifficulty,
        raceText,
        startAt: null,
        finishedAt: null,
      })
      .where(eq(races.id, race.id))
      .returning();

    for (const p of players) {
      await db
        .update(racePlayers)
        .set({
          ready: p.isHost,
          progress: 0,
          errors: 0,
          wpm: 0,
          accuracy: 100,
          finishedAt: null,
          rank: null,
        })
        .where(eq(racePlayers.id, p.id));
    }

    const refreshed = await loadRace(code);
    if (!refreshed) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    return Response.json(serializeRace(updatedRace, refreshed.players));
  } catch (err) {
    console.error("Failed to restart race", err);
    return Response.json({ error: "Failed to restart race" }, { status: 500 });
  }
}
