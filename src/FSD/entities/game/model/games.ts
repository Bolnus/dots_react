import type { GameId, GameListItem } from "./types";

export const GAME_IDS: GameId[] = ["dots", "memory", "snake", "tic-tac-toe"];

export const GAMES: GameListItem[] = [
  { id: "dots", imageSrc: "/games/dots.svg" },
  { id: "memory", imageSrc: "/games/memory.svg" },
  { id: "snake", imageSrc: "/games/snake.svg" },
  { id: "tic-tac-toe", imageSrc: "/games/tic-tac-toe.svg" }
];

/** True when the string is a known game id. */
export function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}
