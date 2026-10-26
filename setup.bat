@echo off
chcp 65001 >nul
title Установка каркаса лаунчера

echo Создание папок...
mkdir src\main\ipc 2>nul
mkdir src\main\core 2>nul
mkdir src\main\utils 2>nul
mkdir src\preload 2>nul
mkdir src\renderer\components\ui 2>nul
mkdir src\renderer\store 2>nul
mkdir src\renderer\lib 2>nul
mkdir src\renderer\styles 2>nul
mkdir src\shared 2>nul

echo Создание файлов...
type nul > src\main\index.ts
type nul > src\main\ipc\index.ts
type nul > src\main\ipc\auth.ts
type nul > src\main\ipc\versions.ts
type nul > src\main\ipc\loaders.ts
type nul > src\main\ipc\modrinth.ts
type nul > src\main\ipc\launch.ts
type nul > src\main\ipc\settings.ts
type nul > src\main\core\AuthService.ts
type nul > src\main\core\VersionManager.ts
type nul > src\main\core\AssetDownloader.ts
type nul > src\main\core\JavaManager.ts
type nul > src\main\core\GameLauncher.ts
type nul > src\main\core\ModrinthService.ts
type nul > src\main\core\Storage.ts
type nul > src\main\core\Logger.ts
type nul > src\main\utils\paths.ts
type nul > src\main\utils\hash.ts
type nul > src\main\utils\retry.ts
type nul > src\preload\index.ts
type nul > src\renderer\index.html
type nul > src\renderer\main.tsx
type nul > src\renderer\App.tsx
type nul > src\renderer\styles\globals.css
type nul > src\renderer\lib\api.ts
type nul > src\renderer\store\useProfileStore.ts
type nul > src\renderer\store\useSettingsStore.ts
type nul > src\renderer\store\useVersionsStore.ts
type nul > src\renderer\components\Sidebar.tsx
type nul > src\renderer\components\HomeScreen.tsx
type nul > src\renderer\components\SettingsModal.tsx
type nul > src\renderer\components\ProfileCard.tsx
type nul > src\renderer\components\VersionCard.tsx
type nul > src\renderer\components\ConsolePanel.tsx
type nul > src\renderer\components\Toast.tsx
type nul > src\shared\types.ts

echo Запись package.json...
(
echo {
echo   "name": "mc-launcher",
echo   "version": "1.0.0",
echo   "description": "Modern Minecraft Launcher",
echo   "main": "./out/main/index.js",
echo   "author": "you",
echo   "scripts": {
echo     "dev": "electron-vite dev",
echo     "build": "electron-vite build",
echo     "postinstall": "electron-builder install-app-deps",
echo     "dist": "electron-vite build ^&^& electron-builder --win --x64"
echo   },
echo   "dependencies": {
echo     "axios": "^1.7.7",
echo     "axios-retry": "^4.5.0",
echo     "electron-store": "^8.2.0",
echo     "framer-motion": "^11.11.0",
echo     "lucide-react": "^0.453.0",
echo     "node-forge": "^1.3.1",
echo     "uuid": "^10.0.0",
echo     "zustand": "^5.0.0"
echo   },
echo   "devDependencies": {
echo     "@types/node": "^22.7.5",
echo     "@types/node-forge": "^1.3.11",
echo     "@types/react": "^18.3.11",
echo     "@types/react-dom": "^18.3.1",
echo     "@types/uuid": "^10.0.0",
echo     "@vitejs/plugin-react": "^4.3.2",
echo     "autoprefixer": "^10.4.20",
echo     "electron": "^33.0.2",
echo     "electron-builder": "^25.1.8",
echo     "electron-vite": "^2.3.0",
echo     "postcss": "^8.4.47",
echo     "react": "^18.3.1",
echo     "react-dom": "^18.3.1",
echo     "tailwindcss": "^3.4.14",
echo     "typescript": "^5.6.3",
echo     "vite": "^5.4.9"
echo   }
echo }
) > package.json

echo Запись конфигов...
(
echo /** @type {import('tailwindcss').Config} */
echo module.exports = {
echo   content: ['./src/renderer/**/*.{ts,tsx,html}'],
echo   darkMode: 'class',
echo   theme: { extend: {} },
echo   plugins: [],
echo };
) > tailwind.config.js

(
echo module.exports = {
echo   plugins: {
echo     tailwindcss: {},
echo     autoprefixer: {},
echo   },
echo };
) > postcss.config.js

(
echo {
echo   "compilerOptions": {
echo     "target": "ES2022",
echo     "module": "ESNext",
echo     "moduleResolution": "Bundler",
echo     "strict": true,
echo     "esModuleInterop": true,
echo     "skipLibCheck": true,
echo     "resolveJsonModule": true,
echo     "jsx": "react-jsx",
echo     "baseUrl": ".",
echo     "paths": {
echo       "@shared/*": ["src/shared/*"],
echo       "@renderer/*": ["src/renderer/*"]
echo     }
echo   },
echo   "include": ["src"]
echo }
) > tsconfig.json

(
echo {
echo   "extends": "./tsconfig.json",
echo   "include": ["src/main", "src/preload", "electron.vite.config.ts"]
echo }
) > tsconfig.node.json

(
echo import { defineConfig } from 'electron-vite';
echo import react from '@vitejs/plugin-react';
echo import { resolve } from 'node:path';
echo export default defineConfig({
echo   main: {
echo     build: { rollupOptions: { external: ['electron'] } },
echo     resolve: { alias: { '@shared': resolve('src/shared') } },
echo   },
echo   preload: {
echo     build: { rollupOptions: { external: ['electron'] } },
echo   },
echo   renderer: {
echo     root: 'src/renderer',
echo     build: { rollupOptions: { input: resolve('src/renderer/index.html') } },
echo     resolve: {
echo       alias: {
echo         '@renderer': resolve('src/renderer'),
echo         '@shared': resolve('src/shared'),
echo       },
echo     },
echo     plugins: [react()],
echo   },
echo });
) > electron.vite.config.ts

(
echo appId: com.yourname.mclauncher
echo productName: MC Launcher
echo directories:
echo   output: release
echo files:
echo   - out/**/*
echo   - package.json
echo win:
echo   target:
echo     - target: nsis
echo       arch: [x64]
echo nsis:
echo   oneClick: false
echo   allowToChangeInstallationDirectory: true
echo   createDesktopShortcut: true
) > electron-builder.yml

(
echo node_modules/
echo out/
echo dist/
echo release/
echo *.log
echo .DS_Store
) > .gitignore

echo.
echo =======================================================
echo Готово! Все папки, пустые файлы и конфиги созданы.
echo Теперь запускай: npm install
echo =======================================================
pause