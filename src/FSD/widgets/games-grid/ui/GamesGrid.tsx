import type { ReactElement } from "react";
import { getTranslations } from "next-intl/server";

import { GAMES } from "@/FSD/entities/game/model/games";
import { GameCard } from "@/FSD/shared/ui/game-card/GameCard";

import styles from "./GamesGrid.module.css";

/** Responsive grid of game cards from static game metadata. */
export async function GamesGrid(): Promise<ReactElement> {
  const t = await getTranslations("games");

  return (
    <div className={styles.grid}>
      {GAMES.map((game) => (
        <GameCard
          key={game.id}
          href={`/games/${game.id}`}
          title={t(`${game.id}.name`)}
          imageSrc={game.imageSrc}
          imageAlt={t(`${game.id}.name`)}
        />
      ))}
    </div>
  );
}
