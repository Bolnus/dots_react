import type { ReactElement } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GAMES, isGameId } from "@/FSD/entities/game/model/games";
import { DotsGame } from "@/FSD/features/dots-game/ui/DotsGame";
import { Link } from "@/FSD/shared/lib/i18n/navigation";
import { GamePageView } from "@/FSD/pages/game/ui/GamePageView";

type GamePageProps = Readonly<{
  params: Promise<{ locale: string; slug: string }>;
}>;

/** Static params for each game slug (locale from parent segment). */
export function generateStaticParams(): { slug: string }[] {
  return GAMES.map((game) => ({ slug: game.id }));
}

/** Per-game metadata when the slug is valid. */
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isGameId(slug)) {
    return {};
  }

  const tGames = await getTranslations({ locale, namespace: "games" });
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: tGames(`${slug}.name`),
    description: tGames(`${slug}.description`),
    openGraph: {
      title: tGames(`${slug}.name`),
      description: tGames(`${slug}.description`),
      siteName: tMeta("title")
    }
  };
}

/** Placeholder game page until games are implemented. */
export default async function GamePage({ params }: GamePageProps): Promise<ReactElement> {
  const { locale, slug } = await params;

  if (!isGameId(slug)) {
    notFound();
  }

  setRequestLocale(locale);
  const tPage = await getTranslations("GamePage");
  const tGames = await getTranslations("games");
  const title = tGames(`${slug}.name`);

  if (slug === "dots") {
    return (
      <GamePageView title={title}>
        <DotsGame />
      </GamePageView>
    );
  }

  return (
    <GamePageView
      backLink={
        <Link href="/" prefetch={false}>
          {tPage("back")}
        </Link>
      }
      title={title}
      note={tPage("comingSoon")}
    />
  );
}
