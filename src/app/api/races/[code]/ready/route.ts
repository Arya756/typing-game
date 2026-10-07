import { db } from "@/db";
import { racePlayers } from "@/db/schema";
import { loadRace, serializeRace } from "@/lib/raceState";
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
    const ready = Boolean(body?.ready);
    if (!playerId) {
      return Response.json({ error: "playerId is required" }, { status: 400 });
    }

    const loaded = await loadRace(code);
    if (!loaded) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }

    await db
      .update(racePlayers)
      .set({ ready, lastSeen: new Date() })
      .where(and(eq(racePlayers.id, playerId), eq(racePlayers.raceId, loaded.race.id)));

    const refreshed = await loadRace(code);
    if (!refreshed) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    return Response.json(serializeRace(refreshed.race, refreshed.players));
  } catch (err) {
    console.error("Failed to update ready state", err);
    return Response.json({ error: "Failed to update ready state" }, { status: 500 });
  }
}
