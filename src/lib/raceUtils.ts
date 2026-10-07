export const CARS: { emoji: string; color: string }[] = [
  { emoji: "🏎️", color: "#ef4444" },
  { emoji: "🚗", color: "#3b82f6" },
  { emoji: "🚙", color: "#22c55e" },
  { emoji: "🚕", color: "#f59e0b" },
  { emoji: "🚓", color: "#8b5cf6" },
  { emoji: "🛻", color: "#ec4899" },
];

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export const COUNTDOWN_MS = 3000;
export const FINISH_GRACE_MS = 20000;

export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.max(0, Math.round(words / minutes));
}

export function calcAccuracy(correctChars: number, errors: number): number {
  const total = correctChars + errors;
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctChars / total) * 100)));
}
