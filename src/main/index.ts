import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'node:fs';
import https from 'node:https';
import http from 'node:http';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Type declaration for the Vite window name injected by Electron Forge
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  // Load the app - either from dev server or production build
  // In development, app.isPackaged is false. In production, it's true
  if (app.isPackaged) {
    // Production build - load from bundled files
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  } else {
    // Development - load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
};

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('create-directory', async (_, dirPath: string) => {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating directory:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('download-file', async (_, url: string, localPath: string) => {
  return new Promise((resolve) => {
    const client = url.startsWith('https://') ? https : http;
    
    client.get(url, async (response) => {
      if (response.statusCode !== 200) {
        resolve({ success: false, error: `HTTP ${response.statusCode}` });
        return;
      }

      try {
        const writeStream = fs.createWriteStream(localPath);
        
        response.on('data', (chunk) => {
          writeStream.write(chunk);
        });

        response.on('end', () => {
          writeStream.end();
          resolve({ success: true });
        });

        response.on('error', (error) => {
          writeStream.close();
          resolve({ success: false, error: String(error) });
        });

        writeStream.on('error', (error) => {
          resolve({ success: false, error: String(error) });
        });
      } catch (error) {
        resolve({ success: false, error: String(error) });
      }
    }).on('error', (error) => {
      resolve({ success: false, error: String(error) });
    });
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

