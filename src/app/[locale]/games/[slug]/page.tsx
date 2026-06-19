import type { ReactElement } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GAMES, isGameId } from "@/FSD/entities/game/model/games";
import { DotsGame } from "@/FSD/widgets/dots-game/ui/DotsGame";
import { BackLink } from "@/FSD/shared/ui/back-link/BackLink";
import { GamePageView } from "@/FSD/pages/game/ui/GamePageView";
import { buildLocalizedMetadata } from "@/FSD/shared/lib/seo";
import publicRoutes from "@/FSD/shared/lib/seo/publicRoutes.json";

type GamePageProps = Readonly<{
  params: Promise<{ locale: string; slug: string }>;
}>;

/** Static params for each game slug (locale from parent segment). */
export function generateStaticParams(): { slug: string }[] {
  return GAMES.map((game) => ({ slug: game.id }));
}

/** True when the game slug is listed as not yet ready for search indexing. */
function isNoIndexGameSlug(slug: string): boolean {
  return (publicRoutes.noIndexGameSlugs as readonly string[]).includes(slug);
}

/** Per-game metadata when the slug is valid. */
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isGameId(slug)) {
    return {};
  }

  const tGames = await getTranslations({ locale, namespace: "games" });
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });

  return buildLocalizedMetadata({
    locale,
    href: `/games/${slug}`,
    title: tGames(`${slug}.name`),
    description: tGames(`${slug}.description`),
    keywords: tMeta("keywords"),
    siteName: tMeta("title"),
    ogImageAlt: tMeta("ogImageAlt"),
    indexable: !isNoIndexGameSlug(slug)
  });
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
      backLink={<BackLink href="/" label={tPage("back")} prefetch={false} />}
      title={title}
      note={tPage("comingSoon")}
    />
  );
}
