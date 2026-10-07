import { db } from "@/db";
import { races } from "@/db/schema";
import { loadRace, serializeRace } from "@/lib/raceState";
import { COUNTDOWN_MS } from "@/lib/raceUtils";
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

    const loaded = await loadRace(code);
    if (!loaded) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    const { race, players } = loaded;

    const host = players.find((p) => p.isHost);
    if (!host || host.id !== playerId) {
      return Response.json({ error: "Only the host can start the race" }, { status: 403 });
    }
    if (race.status !== "lobby") {
      return Response.json({ error: "Race already started" }, { status: 409 });
    }

    const startAt = new Date(Date.now() + COUNTDOWN_MS);
    const [updated] = await db
      .update(races)
      .set({ status: "countdown", startAt })
      .where(eq(races.id, race.id))
      .returning();

    return Response.json(serializeRace(updated, players));
  } catch (err) {
    console.error("Failed to start race", err);
    return Response.json({ error: "Failed to start race" }, { status: 500 });
  }
}
