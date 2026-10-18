interface Window {
  typohaDesktop?: {
    chooseFolder(): Promise<string | null>;
    print(): Promise<void>;
    pdf(): Promise<Uint8Array>;
  };
}
