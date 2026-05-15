"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomSummary } from "../../api/dotsOnlineApiTypes";
import { useRoomsListQuery } from "../../api/useRoomsListQuery";
import styles from "./DotsOnlineRoomsList.module.css";
import { DotsRoomItem } from "./DotsRoomItem";
import { BackButton } from "@/FSD/shared/ui/back-button/BackButton";
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";

export type DotsOnlineRoomsListProps = Readonly<{
  displayName: string;
  isJoining?: boolean;
  joiningRoomId?: string | null;
  onBack: () => void;
  onCreateRoom: () => void;
  onChangeName: () => void;
  onOpenRoom: (roomId: string) => void;
}>;

type RoomsBodyProps = Readonly<{
  isLoading: boolean;
  rooms: readonly DotsRoomSummary[];
  isJoining: boolean;
  joiningRoomId: string | null;
  onOpen: (roomId: string) => void;
  emptyLabel: string;
}>;

/** Renders the loading / empty / populated state for the rooms list body. */
function RoomsBody({ isLoading, rooms, isJoining, joiningRoomId, onOpen, emptyLabel }: RoomsBodyProps): ReactElement {
  if (isLoading) {
    return <div className={styles.loading}>...</div>;
  }
  if (rooms.length === 0) {
    return <div className={styles.empty}>{emptyLabel}</div>;
  }
  return (
    <ul className={styles.list}>
      {rooms.map((room) => (
        <li key={room.id}>
          <DotsRoomItem
            room={room}
            disabled={isJoining}
            isJoiningThisRoom={isJoining && joiningRoomId === room.id}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}

/** Online rooms list view: rooms grid, plus-icon to create, and a Change-name button. */
export function DotsOnlineRoomsList({
  displayName,
  isJoining = false,
  joiningRoomId = null,
  onBack,
  onCreateRoom,
  onChangeName,
  onOpenRoom
}: DotsOnlineRoomsListProps): ReactElement {
  const t = useTranslations("DotsGame");
  const { data: rooms, isLoading } = useRoomsListQuery();

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <BackButton onClick={onBack} label={t("back")} />
          <h2 className={styles.title}>{t("onlineRoomsTitle")}</h2>
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.nameTag}>{displayName}</span>
          <button type="button" className={styles.changeNameButton} onClick={onChangeName} disabled={isJoining}>
            {t("changeName")}
          </button>
          <ButtonIcon
            onClick={onCreateRoom}
            iconName="plus"
            background="solid"
            iconSize="md"
            title={t("createRoomButtonTitle")}
            disabled={isJoining}
          />
        </div>
      </div>
      <RoomsBody
        isLoading={isLoading}
        rooms={rooms ?? []}
        isJoining={isJoining}
        joiningRoomId={joiningRoomId}
        onOpen={onOpenRoom}
        emptyLabel={t("onlineRoomsEmpty")}
      />
    </div>
  );
}
