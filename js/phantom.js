var phantom = {
    child: null,
    track: null,
    available: false,
    executable_path: (() => {
        if(navigator.userAgentData.platform.toLowerCase().includes("win")){
            return "./phantom/phantom.exe";
        } else {
            return "./phantom/phantom";
        }
    })(),
    is_child_alive: false,
    parse: (data) => {
        data = data.split("\n");
        data = data.filter(info => info.match(/\@PHANTOM\.[A-Z]*:[^\n]*/g));
        data.map(info => {
            let [command_info, command_data] = info.split(":");
            if(command_info == "@PHANTOM.CUE") {
                let [time_info, text_info] = command_data.split("||").filter(text => text.length > 2);
                let [time_start_info, time_end_info] = time_info.split("|");

                console.warn(["@PHANTOM", time_start_info/1000, time_end_info/1000, text_info.trim()]);
                let cue = new VTTCue(time_start_info/1000, time_end_info/1000, text_info.trim());
                cue.line = -4;
                phantom.track.addCue(cue);

            } else if(command_info == "@PHANTOM.ERR") {
                console.error(command_data.trim());
            } else if(command_info == "@PHANTOM.VER") {
                console.warn("@PHANTOM - Version: " + command_data.trim());
            } else {
                console.error(`Unknown command: ${command_info}`)
            }
        })
    },
    run: async (audio_file) => {
        if(!audio_file) return console.warn("@PHANTOM: Audio file is not passed");
        await child_process.spawn("ffmpeg", ["-i", audio_file ,"-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", "./phantom/__tmp_phantom.wav"]);
        phantom.track = components.tabs.watch.video.$video.addTextTrack("captions");
        phantom.track.mode = "showing";
        phantom.child = child_process.spawn(phantom.executable_path);
        phantom.is_child_alive = true;

        phantom.child.stderr.on('data', function (data) {
            phantom.parse(data.toString());
        });

        phantom.child.on('exit', function () {
            console.warn("@PHANTOM: Child is exited");
            phantom.is_child_alive = false;
            phantom.child = null;
        });
    }
};

(async () => {
    phantom.available = await (async () => {
        if(navigator.userAgentData.platform.toLowerCase().includes("win")){
            if((await child_process.spawnSync("where", ["ffmpeg.exe"])).status == 0){
                return await fs.exists("./phantom/phantom.exe");
            }
        } else {
            if(!await child_process.spawn("ffmpeg", ["-v"]).error){
                return await fs.exists("./phantom/phantom");
            }
        }
        return false;
    })();

    if(phantom.available) { // Phantom is available
        document.body.setAttribute("phantom", true);
    };
})();
