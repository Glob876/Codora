const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("codoraDesktop", {
  setCompact: (active) => ipcRenderer.invoke("codora:compact", active),
  setLanguage: (language) => ipcRenderer.invoke("codora:language", language),
  windowControl: (action) => ipcRenderer.invoke("codora:window", action),
  chooseFile: () => ipcRenderer.invoke("codora:file"),
  chooseFolder: () => ipcRenderer.invoke("codora:folder"),
  print: () => ipcRenderer.invoke("codora:print"),
  pdf: () => ipcRenderer.invoke("codora:pdf"),
});
