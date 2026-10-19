interface Window {
  codoraDesktop?: {
    setCompact(active: boolean): Promise<void>;
    setLanguage(language: string): Promise<void>;
    windowControl(action: "minimize" | "maximize" | "close"): Promise<void>;
    chooseFile(): Promise<{ root: string; path: string } | null>;
    chooseFolder(): Promise<string | null>;
    print(): Promise<void>;
    pdf(): Promise<Uint8Array>;
  };
}
