import type { ReactElement, ReactNode } from "react";

import styles from "./GamePageView.module.css";

type GamePageViewProps = Readonly<{
  backLink: ReactNode;
  title: string;
  note: string;
}>;

/** Game page layout; routing stays in Next.js `page.tsx`. */
export function GamePageView({ backLink, title, note }: GamePageViewProps): ReactElement {
  return (
    <main className={styles.main}>
      <div className={styles.back}>{backLink}</div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.note}>{note}</p>
    </main>
  );
}
