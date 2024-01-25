var yt_extractor = require("./yt-extractor");
var fs = require("node:fs/promises");
window.addEventListener("DocumentReady", () => {
    window.http = require("node:http");
    window.https = require("node:https");
    window.fs_legacy = require("node:fs");
    window.child_process = require("node:child_process");
})

fs.exists = async (file_name) => {
    try {
        await fs.realpath(file_name);
        return true;
    } catch {
        return false;
    }
}
