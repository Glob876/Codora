const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("typohaDesktop", {
  setLanguage: (language) => ipcRenderer.invoke("typoha:language", language),
  windowControl: (action) => ipcRenderer.invoke("typoha:window", action),
  chooseFile: () => ipcRenderer.invoke("typoha:file"),
  chooseFolder: () => ipcRenderer.invoke("typoha:folder"),
  print: () => ipcRenderer.invoke("typoha:print"),
  pdf: () => ipcRenderer.invoke("typoha:pdf"),
});
