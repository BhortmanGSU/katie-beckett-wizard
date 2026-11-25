// Desktop shell for Katie Beckett Helper.
// Runs a built-in local web server so the desktop app and any phone/tablet
// on the family's home Wi-Fi or VPN share the exact same private data live.
const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');
const { startLocalServer } = require('./server.cjs');

const DIST = path.join(__dirname, '..', 'dist');
let localServer = null;

function createWindow(port, pin) {
  const localOrigin = `http://127.0.0.1:${port}`;
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: 'Katie Beckett Helper',
    backgroundColor: '#fdf8f1',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  // Any external link opens in the family's normal browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(localOrigin)) {
      e.preventDefault();
      if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL(`${localOrigin}/?pin=${pin}`);
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));

  const dataDir = path.join(app.getPath('userData'), 'family-data');
  localServer = await startLocalServer({ distDir: DIST, dataDir, preferredPort: 8421 });

  createWindow(localServer.port, localServer.pin);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && localServer) {
      createWindow(localServer.port, localServer.pin);
    }
  });
});

app.on('window-all-closed', () => {
  localServer?.close();
  if (process.platform !== 'darwin') app.quit();
});
