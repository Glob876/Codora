export interface Settings {
  language: string;
  backgroundOpacity: number;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  animations: boolean;
  toolbar: boolean;
  statusbar: boolean;
  sidebarWidth: number;
  tabSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  autosaveDelay: number;
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
  language: "ru",
  backgroundOpacity: 100,
  theme: "paper",
  primaryColor: "",
  secondaryColor: "",
  textColor: "",
  animations: true,
  toolbar: true,
  statusbar: true,
  sidebarWidth: 250,
  tabSize: 2,
  lineNumbers: true,
  wordWrap: true,
  autosaveDelay: 1600,
  font: "serif",
  fontSize: 18,
  width: 820,
  lineHeight: 1.8,
  autosave: true,
  spellcheck: true,
  focus: false,
  typewriter: false,
  hidden: false,
  allFiles: true,
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
