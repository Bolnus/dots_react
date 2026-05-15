"use client";

import { useState, type ReactElement } from "react";

import { DotsTopViewKind, type DotsTopView } from "@/FSD/features/dots-game/model/orchestratorTypes";
import { DotsHotSeatSetup } from "@/FSD/features/dots-game/ui/hot-seat/DotsHotSeatSetup";
import { DotsMainMenu } from "@/FSD/features/dots-game/ui/lobby/DotsMainMenu";
import { DotsOnlineSetup } from "@/FSD/features/dots-game/ui/online/DotsOnlineSetup";

/** Top-level dots widget: routes between lobby, hot-seat, and online flows. */
export function DotsGame(): ReactElement {
  const [view, setView] = useState<DotsTopView>({ kind: DotsTopViewKind.Lobby });

  if (view.kind === DotsTopViewKind.Lobby) {
    return (
      <DotsMainMenu
        onPickOnline={() => setView({ kind: DotsTopViewKind.Online })}
        onPickHotSeat={() => setView({ kind: DotsTopViewKind.HotSeat })}
      />
    );
  }
  if (view.kind === DotsTopViewKind.HotSeat) {
    return <DotsHotSeatSetup onBack={() => setView({ kind: DotsTopViewKind.Lobby })} />;
  }
  return <DotsOnlineSetup onBackToLobby={() => setView({ kind: DotsTopViewKind.Lobby })} />;
}
