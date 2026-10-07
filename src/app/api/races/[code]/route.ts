import { resolveRaceState, serializeRace } from "@/lib/raceState";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const resolved = await resolveRaceState(code);
  if (!resolved) {
    return Response.json({ error: "Race not found" }, { status: 404 });
  }
  return Response.json(serializeRace(resolved.race, resolved.players));
}
