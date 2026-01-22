import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

import { spawn } from "node:child_process";

let sidecarProcess = null;

const isDev = !app.isPackaged;

const sidecarPath = isDev
  ? path.join(process.cwd(), "sidecar", "bin", "sidecar") // Dev: Project Root/sidecar/bin/sidecar
  : path.join(process.resourcesPath, "bin", "sidecar"); // Prod: Packaged resources

function startSidecar() {
  console.log(`[Main] Spawning sidecar: ${sidecarPath}`);

  // 2. Spawn the process (No shell, no exec)
  sidecarProcess = spawn(sidecarPath, [], {
    windowsHide: true, // Hide cmd window on Windows
  });

  // 3. Capture stdout (Informational)
  sidecarProcess.stdout.on("data", (data) => {
    console.log(`[sidecar stdout] ${data.toString().trim()}`);
  });

  // 4. Capture stderr (Serious)
  sidecarProcess.stderr.on("data", (data) => {
    console.error(`[sidecar stderr] ${data.toString().trim()}`);
  });

  // 5. Handle Exit
  sidecarProcess.on("exit", (code, signal) => {
    console.log(`[Main] Sidecar exited. Code: ${code}, Signal: ${signal}`);
    sidecarProcess = null;
  });

  sidecarProcess.on("error", (err) => {
    console.error(`[Main] Failed to start sidecar: ${err.message}`);
  });
}

// 6. Lifecycle Management: Kill the child when Electron quits
app.on("will-quit", () => {
  if (sidecarProcess) {
    console.log("[Main] Sending SIGTERM to sidecar...");
    sidecarProcess.kill("SIGTERM");
  }
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  startSidecar();
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
