export type GameId = "dots" | "memory" | "snake" | "tic-tac-toe";

export type GameListItem = {
  id: GameId;
  imageSrc: string;
};
