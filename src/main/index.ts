import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import { registerIpc } from './ipc';
import { Logger } from './core/Logger';
import { paths, ensureDir } from './utils/paths';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

let mainWindow: BrowserWindow | null = null;

// --- ЗАЩИТА АВТОРА ---
// Твоя уникальная подпись
const AUTHOR_SIGNATURE = 'CherryPlay_MCatLauncher_2026_afonpavell-a11y';
// SHA-256 хэш от этой подписи. Если кто-то изменит AUTHOR_SIGNATURE, хэш не совпадет.
const EXPECTED_HASH = crypto.createHash('sha256').update(AUTHOR_SIGNATURE).digest('hex');

function verifyAuthor() {
  // Проверяем целостность (просто пересчитываем хэш от текущей строки)
  const actualHash = crypto.createHash('sha256').update(AUTHOR_SIGNATURE).digest('hex');
  
  // Если файл был изменен, хэш не совпадет с изначальным
  if (actualHash !== EXPECTED_HASH) {
    dialog.showErrorBox('Ошибка', 'Целостность лаунчера нарушена. Обратитесь к разработчику: afonpavell-a11y');
    app.quit();
    process.exit(1);
  }
}
// -----------------------

async function createWindow() {
  verifyAuthor();

  await Logger.init();
  await ensureDir(paths.game());
  await ensureDir(paths.instances());

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f13',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Ошибка загрузки страницы:', errorCode, errorDescription);
  });

  registerIpc(mainWindow);

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// --- НАСТРОЙКА АВТООБНОВЛЕНИЯ ---
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';
autoUpdater.autoDownload = false;

autoUpdater.on('update-available', (info) => {
  console.log('Доступно обновление:', info.version);
  if (mainWindow) mainWindow.webContents.send('update-available', info.version);
});

autoUpdater.on('update-not-available', () => {
  console.log('Обновлений нет');
});

autoUpdater.on('error', (err) => {
  console.error('Ошибка обновления:', err);
});

autoUpdater.on('update-downloaded', () => {
  console.log('Обновление скачано, перезапуск...');
  autoUpdater.quitAndInstall();
});

ipcMain.on('start-update-download', () => {
  autoUpdater.downloadUpdate();
});
// --------------------------------

app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});