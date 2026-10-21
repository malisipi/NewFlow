if(global.ytdlp_cache === undefined) global.ytdlp_cache = {};
var ytdlp_cache_invalidate = x => Object.keys(ytdlp_cache).filter(a=>a.includes(x)).map(a=>delete ytdlp_cache[a]);

var yt_dlp = async (args, ytdlp_cache_time=12*60*60*1000) => { // cache = 12 hours
    const key = JSON.stringify(args);
    if(!!ytdlp_cache[key]){
        const entry = ytdlp_cache[key];
        if(Date.now() - entry.time < ytdlp_cache_time){
            return entry.data;
        };
    };

    let {stdout, stderr} = await execFileAsync("yt-dlp", args, {
        maxBuffer: 1024*1024*50,
        encoding: "utf-8"
    });

    if(stderr != "") console.error(stderr);

    ytdlp_cache[key] = {
        time: Date.now(),
        data: JSON.parse(stdout)
    };
    return ytdlp_cache[key].data;
};

var fs = require("node:fs/promises");
var path = require('node:path');
window.addEventListener("DocumentReady", () => {
    window.http = require("node:http");
    window.https = require("node:https");
    window.fs_legacy = require("node:fs");
    window.child_process = require("node:child_process");
    let _util = require("util");
    window.execFileAsync = _util.promisify(child_process.execFile);
})

fs.exists = async (file_name) => {
    try {
        await fs.realpath(file_name);
        return true;
    } catch {
        return false;
    }
}
