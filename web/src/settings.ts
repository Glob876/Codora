export interface Settings {
  theme: "paper" | "night" | "sepia" | "system";
  font: string;
  fontSize: number;
  width: number;
  lineHeight: number;
  autosave: boolean;
  spellcheck: boolean;
  focus: boolean;
  typewriter: boolean;
  hidden: boolean;
  allFiles: boolean;
  sort: "name" | "modified";
  customCss: string;
  recent: string[];
  pinned: string[];
}
export const defaults: Settings = {
  theme: "paper",
  font: "serif",
  fontSize: 18,
  width: 820,
  lineHeight: 1.8,
  autosave: true,
  spellcheck: true,
  focus: false,
  typewriter: false,
  hidden: false,
  allFiles: false,
  sort: "name",
  customCss: "",
  recent: [],
  pinned: [],
};
export function loadLocalSettings(): Settings {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem("typoha-settings") || "{}"),
    };
  } catch {
    return { ...defaults };
  }
}
