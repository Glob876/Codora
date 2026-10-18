const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("typohaDesktop", {
  chooseFile: () => ipcRenderer.invoke("typoha:file"),
  chooseFolder: () => ipcRenderer.invoke("typoha:folder"),
  print: () => ipcRenderer.invoke("typoha:print"),
  pdf: () => ipcRenderer.invoke("typoha:pdf"),
});
