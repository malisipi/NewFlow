const electron = require('electron');

const remote = require('@electron/remote/main');
const path = require("node:path");
const fs = require("node:fs");

remote.initialize();

electron.app.on("ready", async _ => {
    let window_config = {};
    try {
        window_config = JSON.parse(await fs.readFileSync("./window_config.json"));
    } catch {};
    window_config.material = {"mica":"mica","acrylic":"acrylic","noise":"noise"}[window_config.material] ?? "default";
    window_config.transparent = window_config.material != "default";

    newflow = new electron.BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: window_config.transparent,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: [`--newflow-material=${window_config.material}`]
        }
    });
    newflow.loadFile("index.html");
    remote.enable(newflow.webContents);

    newflow.on("closed", _ => {
        electron.app.quit();
    });
});
