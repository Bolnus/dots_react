import type { ReactElement } from "react";

import { THEME_DARK, THEME_LIGHT, THEME_STORAGE_KEY } from "./constants";

/** Runs before paint: restores saved theme or falls back to prefers-color-scheme. */
export function ThemeScript(): ReactElement {
  const keyJson = JSON.stringify(THEME_STORAGE_KEY);
  const lightJson = JSON.stringify(THEME_LIGHT);
  const darkJson = JSON.stringify(THEME_DARK);
  const code = [
    "(function(){try{",
    `var k=${keyJson};`,
    "var t=localStorage.getItem(k);",
    "var d=document.documentElement;",
    `if(t===${lightJson}||t===${darkJson}){d.setAttribute("data-theme",t);}`,
    "else{",
    'var mq=window.matchMedia("(prefers-color-scheme: light)");',
    `d.setAttribute("data-theme",mq.matches?${lightJson}:${darkJson});`,
    "}",
    "}catch(e){}})();"
  ].join("");

  // eslint-disable-next-line @typescript-eslint/naming-convention -- React `dangerouslySetInnerHTML` contract
  const serialized = { __html: code };

  return <script dangerouslySetInnerHTML={serialized} />;
}
