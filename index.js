const electron = require('electron');

process.chdir(electron.app.getAppPath());

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

    window_config.args = [`--newflow-material=${window_config.material}`];

    if(!window_config.transparent) {
        window_config.titlebar_style = ["default", "hidden"][Number(window_config.system_titlebar)];
        window_config.titlebar_overlay = [false, {color: "#00000000", symbolColor: "#FFFFFF", height: 30}][Number(window_config.system_titlebar)];
        if(window_config.system_titlebar){
            window_config.args = [...window_config.args, "--newflow-system-titlebar"];
        };
    } else {
        window_config.titlebar_style = "default";
        window_config.titlebar_overlay = false;
    }

    newflow = new electron.BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: window_config.transparent,
        titleBarStyle: window_config.titlebar_style,
        titleBarOverlay: window_config.titlebar_overlay,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js'),
            additionalArguments: window_config.args
        }
    });
    newflow.loadFile("index.html");
    remote.enable(newflow.webContents);

    newflow.on("closed", _ => {
        electron.app.quit();
    });
});
