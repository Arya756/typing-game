import RaceRoom from "@/components/RaceRoom";

export const dynamic = "force-dynamic";

export default async function RacePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <RaceRoom code={code.toUpperCase()} />;
}
