import { db } from "@/db";
import { racePlayers } from "@/db/schema";
import { loadRace, serializeRace } from "@/lib/raceState";
import { calcAccuracy, calcWpm } from "@/lib/raceUtils";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const body = await request.json();
    const playerId = typeof body?.playerId === "string" ? body.playerId : "";
    const progress = Number.isFinite(body?.progress) ? Math.max(0, Math.floor(body.progress)) : 0;
    const errors = Number.isFinite(body?.errors) ? Math.max(0, Math.floor(body.errors)) : 0;
    const finished = Boolean(body?.finished);

    if (!playerId) {
      return Response.json({ error: "playerId is required" }, { status: 400 });
    }

    const loaded = await loadRace(code);
    if (!loaded) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    const { race, players } = loaded;
    const player = players.find((p) => p.id === playerId);
    if (!player) {
      return Response.json({ error: "Player not found" }, { status: 404 });
    }

    const startedAtMs = race.startAt ? race.startAt.getTime() : Date.now();
    const elapsedMs = Date.now() - startedAtMs;
    const wpm = calcWpm(progress, elapsedMs);
    const accuracy = calcAccuracy(progress, errors);

    await db.transaction(async (tx) => {
      let finishedAt = player.finishedAt;
      let rank = player.rank;

      if (finished && !player.finishedAt) {
        const alreadyFinished = players.filter((p) => p.finishedAt).length;
        finishedAt = new Date();
        rank = alreadyFinished + 1;
      }

      await tx
        .update(racePlayers)
        .set({
          progress,
          errors,
          wpm,
          accuracy,
          finishedAt,
          rank,
          lastSeen: new Date(),
        })
        .where(and(eq(racePlayers.id, playerId), eq(racePlayers.raceId, race.id)));
    });

    const refreshed = await loadRace(code);
    if (!refreshed) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    return Response.json(serializeRace(refreshed.race, refreshed.players));
  } catch (err) {
    console.error("Failed to update progress", err);
    return Response.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
