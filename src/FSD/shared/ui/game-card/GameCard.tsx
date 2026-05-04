import type { ReactElement } from "react";
import Image from "next/image";

import { Link } from "@/FSD/shared/lib/i18n/navigation";

import styles from "./GameCard.module.css";

type GameCardProps = Readonly<{
  href: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
}>;

/** Link card with cover art and localized title; hover in CSS modules. */
export function GameCard({ href, title, imageSrc, imageAlt }: GameCardProps): ReactElement {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image src={imageSrc} alt={imageAlt} width={640} height={400} className={styles.image} priority={false} />
      </div>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
      </div>
    </Link>
  );
}
