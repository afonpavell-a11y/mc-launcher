import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { registerIpc } from './ipc';
import { Logger } from './core/Logger';
import { paths, ensureDir } from './utils/paths';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  await Logger.init();
  
  // Создаем папку game, если ее нет (теперь paths.game() точно существует)
  await ensureDir(paths.game());
  await ensureDir(paths.instances()); // Создаем папку для сборок

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f13',
    show: false, // Скрываем, пока не загрузится
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Показываем окно, когда оно готово (чтобы не было белого экрана)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Ловим ошибки загрузки страницы (чтобы не было пустого экрана без объяснений)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Ошибка загрузки страницы:', errorCode, errorDescription);
    // Если страница не грузится в dev-режиме, показываем базовый HTML
    if (process.env['ELECTRON_RENDERER_URL']) {
       mainWindow?.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
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