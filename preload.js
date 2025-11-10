const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readJournalData: () => ipcRenderer.invoke('read-journal-data'),
  saveJournalData: (data) => ipcRenderer.invoke('save-journal-data', data)
});