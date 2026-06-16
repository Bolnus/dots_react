"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";

import type { DotsRoomSummary, DotsSessionActiveRoom } from "../../api/dotsOnlineApiTypes";
import { useRoomsListQuery } from "../../api/useRoomsListQuery";
import styles from "./DotsOnlineRoomsList.module.css";
import { DotsRoomItem } from "./DotsRoomItem";
import { BackButton } from "@/FSD/shared/ui/back-button/BackButton";
import { ButtonIcon } from "@/FSD/shared/ui/button-icon/ButtonIcon";
import { SectionFetching } from "@/FSD/shared/ui/section-fetching/SectionFetching";

export type DotsOnlineRoomsListProps = Readonly<{
  displayName: string;
  activePlayingRoom?: DotsSessionActiveRoom | null;
  isJoining?: boolean;
  joiningRoomId?: string | null;
  onBack: () => void;
  onCreateRoom: () => void;
  onChangeName: () => void;
  onReconnect: () => void;
  onOpenRoom: (roomId: string) => void;
}>;

type RoomsBodyProps = Readonly<{
  isFetching: boolean;
  isError: boolean;
  rooms: readonly DotsRoomSummary[];
  isJoining: boolean;
  joiningRoomId: string | null;
  onOpen: (roomId: string) => void;
  onRetry: () => void;
  emptyLabel: string;
  loadingLabel: string;
  errorLabel: string;
  retryLabel: string;
}>;

/** Renders the loading / error / empty / populated state for the rooms list body. */
function RoomsBody({
  isFetching,
  isError,
  rooms,
  isJoining,
  joiningRoomId,
  onOpen,
  onRetry,
  emptyLabel,
  loadingLabel,
  errorLabel,
  retryLabel
}: RoomsBodyProps): ReactElement {
  if (isFetching) {
    return <SectionFetching label={loadingLabel} />;
  }
  if (isError) {
    return (
      <div className={styles.error}>
        <p>{errorLabel}</p>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          {retryLabel}
        </button>
      </div>
    );
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

/** Online rooms list view: rooms grid, plus-icon to create, and display-name edit control. */
export function DotsOnlineRoomsList({
  displayName,
  activePlayingRoom = null,
  isJoining = false,
  joiningRoomId = null,
  onBack,
  onCreateRoom,
  onChangeName,
  onReconnect,
  onOpenRoom
}: DotsOnlineRoomsListProps): ReactElement {
  const t = useTranslations("DotsGame");
  const { data: rooms, isFetching, isError, refetch } = useRoomsListQuery();
  const hasActiveGame = activePlayingRoom?.status === "playing";
  const showFetching = isFetching && rooms === undefined;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <BackButton onClick={onBack} label={t("back")} />
          <h2 className={styles.title}>{t("onlineRoomsTitle")}</h2>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.nameBlock}>
            <span className={styles.nameTag}>{displayName}</span>
            {hasActiveGame ? (
              <ButtonIcon
                onClick={onReconnect}
                iconName="show"
                background="ghost"
                iconSize="sm"
                title={t("reconnect")}
                disabled={isJoining}
                className={styles.nameBlockEdit}
              />
            ) : (
              <ButtonIcon
                onClick={onChangeName}
                iconName="pencil"
                background="ghost"
                iconSize="sm"
                title={t("changeName")}
                disabled={isJoining}
                className={styles.nameBlockEdit}
              />
            )}
          </div>
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
        isFetching={showFetching}
        isError={isError && rooms === undefined}
        rooms={Array.isArray(rooms) ? rooms : []}
        isJoining={isJoining}
        joiningRoomId={joiningRoomId}
        onOpen={onOpenRoom}
        onRetry={() => void refetch()}
        emptyLabel={t("onlineRoomsEmpty")}
        loadingLabel={t("loadingRooms")}
        errorLabel={t("genericApiError")}
        retryLabel={t("retry")}
      />
    </div>
  );
}
