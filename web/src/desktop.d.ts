interface Window {
  typohaDesktop?: {
    chooseFile(): Promise<{ root: string; path: string } | null>;
    chooseFolder(): Promise<string | null>;
    print(): Promise<void>;
    pdf(): Promise<Uint8Array>;
  };
}
