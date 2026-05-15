import type { ReactElement, ReactNode } from "react";

import styles from "./GamePageView.module.css";

type GamePageViewProps = Readonly<{
  backLink?: ReactNode;
  title: string;
  note?: string;
  children?: ReactNode;
}>;

/** Game page layout; routing stays in Next.js `page.tsx`. */
export function GamePageView({ backLink, title, note, children }: GamePageViewProps): ReactElement {
  return (
    <main className={styles.main}>
      {backLink ? <div className={styles.back}>{backLink}</div> : null}
      <h1 className={styles.title}>{title}</h1>
      {note ? <p className={styles.note}>{note}</p> : null}
      {children ? <div className={styles.content}>{children}</div> : null}
    </main>
  );
}
