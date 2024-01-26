var components = {
    $_human_readable_time: time => `${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,"0")}`,
    $_window: null,
    controls: {
        close: document.querySelector(".close"),
        time_slider: document.querySelector(".time-slider"),
        sound: document.querySelector(".sound"),
        previous: document.querySelector(".previous"),
        backward: document.querySelector(".backward"),
        play_pause: document.querySelector(".play-pause"),
        forward: document.querySelector(".forward"),
        next: document.querySelector(".next"),
        fullscreen: document.querySelector(".fullscreen"),
        time_info: {
            current_time: document.querySelector(".current-time"),
            duration: document.querySelector(".duration")
        }
    },
    video: null,
    __interval: setInterval(() => {
        let video_component = document.querySelector("video");
        if(!!video_component) {
            console.log("Video conntected to PiP");
            components.video = video_component;
            clearInterval(components.__interval);
            components.$_add_temp_listeners();
        };
    }, 100),
    __abort_controller: new AbortController(),
    $_add_temp_listeners: () => {
        components.video.addEventListener("pause", () => {
            components.controls.play_pause.innerText = "play_arrow";
        }, {signal: components.__abort_controller.signal});
        components.video.addEventListener("play", () => {
            components.controls.play_pause.innerText = "pause";
        }, {signal: components.__abort_controller.signal});
        components.controls.play_pause.innerText = ["pause","play_arrow"][Number(components.video.paused)];

        components.video.addEventListener("durationchange", () => {
            time = components.video.duration;
            components.controls.time_slider.max = time;
            components.controls.time_info.duration.innerText = components.$_human_readable_time(time);
        }, {signal: components.__abort_controller.signal});
        components.video.dispatchEvent(new Event("durationchange"));

        components.video.addEventListener("timeupdate", () => {
            let time = components.video.currentTime;
            components.controls.time_slider.value = time;
            components.controls.time_info.current_time.innerText = components.$_human_readable_time(time);
        }, {signal: components.__abort_controller.signal});

        components.video.$$$video.$audio.addEventListener("volumechange", () => {
            components.controls.sound.innerText = ["volume_up", "volume_off"][Number(components.video.$$$video.$muted())];
        }, {signal: components.__abort_controller.signal});
        components.video.$$$video.$audio.dispatchEvent(new Event("volumechange"));
    }
};

components.controls.close.addEventListener("click", () => {
    window.close();
});

components.controls.sound.addEventListener("click", () => {
    components.video.$$$video.$_mute();
});
components.controls.previous.addEventListener("click", () => {
    components.video.$$$video.$_previous();
});
components.controls.backward.addEventListener("click", () => {
    components.video.$$$video.$_seekby(-5);
});
components.controls.play_pause.addEventListener("click", () => {
    components.video.$$$video.$_play_pause();
});
components.controls.forward.addEventListener("click", () => {
    components.video.$$$video.$_seekby(5);
});
components.controls.next.addEventListener("click", () => {
    components.video.$$$video.$_next();
});
components.controls.time_slider.addEventListener("input", () => {
    components.video.currentTime = components.controls.time_slider.value;
});

electron_loaded = () => {
	components.$_window = electron.BrowserWindow.getAllWindows().filter(_window => _window.getTitle() == document.title)[0];
	components.controls.fullscreen.addEventListener("click", () => {
	    if(components.$_window.isFullScreen()) {
	        components.$_window.setFullScreen(false);
            components.controls.fullscreen.innerText = "fullscreen";
	    } else {
	        components.$_window.setFullScreen(true);
            components.controls.fullscreen.innerText = "fullscreen_exit";
	    }
	});

    // Set always on top (not works @ Linux/Wayland)
	components.$_window.setAlwaysOnTop(true);
}

// Add event listeners to abort all event listeners

window.onunload = () => {
    components.__abort_controller.abort();
}
