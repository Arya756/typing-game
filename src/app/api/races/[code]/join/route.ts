import { db } from "@/db";
import { racePlayers } from "@/db/schema";
import { loadRace, serializeRace } from "@/lib/raceState";
import { CARS } from "@/lib/raceUtils";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const loaded = await loadRace(code);
    if (!loaded) {
      return Response.json({ error: "Race not found" }, { status: 404 });
    }
    const { race, players } = loaded;

    if (race.status !== "lobby") {
      return Response.json({ error: "This race has already started" }, { status: 409 });
    }
    if (players.length >= CARS.length) {
      return Response.json({ error: "This race is full" }, { status: 409 });
    }

    const car = CARS[players.length % CARS.length];
    const [player] = await db
      .insert(racePlayers)
      .values({
        raceId: race.id,
        name,
        color: car.color,
        emoji: car.emoji,
        isHost: false,
      })
      .returning();

    const updatedPlayers = [...players, player];
    return Response.json({
      playerId: player.id,
      race: serializeRace(race, updatedPlayers),
    });
  } catch (err) {
    console.error("Failed to join race", err);
    return Response.json({ error: "Failed to join race" }, { status: 500 });
  }
}
