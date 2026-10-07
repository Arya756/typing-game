import { db } from "@/db";
import { racePlayers, races } from "@/db/schema";
import { pickRandomText, type Difficulty } from "@/lib/raceTexts";
import { CARS, generateRoomCode } from "@/lib/raceUtils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function findUniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateRoomCode();
    const existing = await db.select().from(races).where(eq(races.code, code)).limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error("Could not generate a unique room code");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
    const difficulty: Difficulty = ["easy", "medium", "hard"].includes(body?.difficulty)
      ? body.difficulty
      : "medium";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const code = await findUniqueCode();
    const raceText = pickRandomText(difficulty);

    const [race] = await db
      .insert(races)
      .values({ code, difficulty, raceText, status: "lobby" })
      .returning();

    const car = CARS[0];
    const [player] = await db
      .insert(racePlayers)
      .values({
        raceId: race.id,
        name,
        color: car.color,
        emoji: car.emoji,
        isHost: true,
      })
      .returning();

    return Response.json({ code: race.code, playerId: player.id });
  } catch (err) {
    console.error("Failed to create race", err);
    return Response.json({ error: "Failed to create race" }, { status: 500 });
  }
}
