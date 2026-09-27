const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "AgencyOps Logistics Analyzer"
  });

  mainWindow.loadURL('http://localhost:3000');
  
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Boot the Express backend alongside the Electron shell
  serverProcess = spawn('node', [path.join(__dirname, 'dist/server.cjs')], { stdio: 'inherit' });
  
  // Give the server 2 seconds to boot before loading the URL
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
