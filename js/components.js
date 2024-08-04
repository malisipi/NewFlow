// Define main components

var components = {
    $: {
        $_debug: electron.process.env.NEWFLOW_DEBUG == 1,
        $_window: electron.getCurrentWindow(),
        $_os: ["other","linux"][Number(navigator.userAgentData.platform.toLowerCase().includes("linux"))]
    },
    $_human_readable_time: time => `${(time>=3600)?Math.floor(time/3600)+":":""}${(String(Math.floor(time/60)%60).length==1 && time>=3600)?"0":""}${Math.floor(time/60)%60}:${String(Math.floor(time%60)).padStart(2,"0")}`,
    $_convert_to_save_chars: (word) => word.replace(/[\[\]\(\)\^\#\%\&\!\@\:\+\=\{\}\'\~\\\/\:\*\?\"\<\>\|]/g, "_"),
    titlebar: {
        $: document.querySelector(".titlebar"),
        title: null,
        search: {
            $: null,
            datalist: null,
            $timeout: null,
            $last_search: "",
            $_clear: () => {
                components.titlebar.search.datalist.innerHTML = "";
            },
            $_load: (list) => {
                list.forEach((query) => {
                    let option = document.createElement("option");
                    option.value = query;
                    if(!query.includes(components.titlebar.search.$.value)) { // to show up the suggestion (navigator:Chromium)
                        option.label = components.titlebar.search.$.value;
                    }
                    components.titlebar.search.datalist.append(option);
                })
            }
        },
        minimize: null,
        maximize: null,
        button_layout: null,
        close: null,
        menu: null
    },
    sidenav: {
        $: document.querySelector(".sidenav"),
        devtools: null,
        $handlers: {
            history: () => {
                render.history();
            },
            following: () => {
                render.following();
            },
            feed: async () => {
                render.feed();
                if(database.feed.content.fetch_time == undefined || (new Date() - (new Date(database.feed.content.fetch_time)))/1000/60/60/24 > 0.25){ // if not cached || if cache older than 1/4 day (6 hours), fetch again
                    await database.feed.fetch();
                    render.feed();
                };
            },
            downloads: () => {
                components.tabs.downloads.$_sync();
                render.downloads();
            },
            playlists: () => {
                render.playlists();
            }
        }
    },
    playbar: {
        $: document.querySelector(".playbar"),
        title: null,
        owner: null,
        thumbnail: null,
        controls: {
            $: null,
            queue: null,
            play_pause: null,
            close: null
        }
    },
    global_actions: {
        search: document.querySelector(".global-action.search")
    },
    share: {
        $: document.querySelector("#share"),
        actions: {
            close: null,
            twitter_x: null,
            whatsapp: null,
            telegram: null,
            copy_link: null,
            open_in_browser: null
        },
        $_share: (link) => {
            if(!!link){
                components.share.$.setAttribute("share_url", link);
                components.share.$.open = true;
            }
        },
        $_close: () => {
            components.share.$.setAttribute("share_url", "about:blank");
            components.share.$.open = false;
        }
    },
    tabs: {
        $: document.querySelector(".tabs"),
        $_switch: (tab) => {
            components.tabs.$.setAttribute("active", tab);
        },
        $active: () => {
            return components.tabs.$.getAttribute("active") ?? null;
        },
        watch: {
            $: null,
            $$response: null,
            video: {
                video_player: {
                    $: null,
                    thumbnail: null,
                    stream_date: {
                        $: null,
                        date: null
                    },
                    controls: {
                        $:null,
                        time_slider: null,
                        previous: null,
                        backward: null,
                        play_pause: null,
                        forward: null,
                        volume: null,
                        volume_slider: null,
                        next: null,
                        speed: null,
                        more: null,
                        theatre: null,
                        timelines: null,
                        captions: null,
                        fullscreen: null,
                        time_info: {
                            $: null,
                            duration: null,
                            current_time: null
                        },
                        details: {
                            $$: {
                                speed: null,
                                more: null,
                                video_quality: null,
                                audio_quality: null,
                                captions: null,
                                timelines: null
                            },
                            handlers: {
                                speed: (value) => {
                                    components.tabs.watch.video.$_speed(Number(value));
                                },
                                more: (item) => {
                                    components.tabs.watch.video.video_player.controls.details.toggle(item);
                                },
                                video_quality: (index) => {
                                    components.tabs.watch.video.$_change_stream("video", index);
                                },
                                audio_quality: (index) => {
                                    components.tabs.watch.video.$_change_stream("audio", index);
                                },
                                audio_pitch: (value) => {
                                    components.tabs.watch.video.$_pitch(Number(value));
                                },
                                captions: (id) => {
                                    if (id == -1) {
                                        components.tabs.watch.video.$captions.$_remove();
                                    } else {
                                        components.tabs.watch.video.$captions.$_load.$(id);
                                    }
                                },
                                timelines: (value) => {
                                    components.tabs.watch.video.$_seekto(value);
                                }
                            },
                            toggle: (id) => {
                                Object.entries(components.tabs.watch.video.video_player.controls.details.$$).map(x => x[1]).map(element => element.hidden = true);
                                let page = components.tabs.watch.video.video_player.controls.details.$$[id];
                                setTimeout(() => { // A 0 timeout to ignore current mouse click (if exists)
                                    document.addEventListener("click", (event, _id=id, details_page=page) => {
                                        if(details_page.contains(event.target)){
                                            if(details_page.className.includes("list")){
                                                if(event.target.className.includes("list-item")){
                                                    components.tabs.watch.video.video_player.controls.details.handlers[_id](event.target.getAttribute("value"));
                                                };
                                            };
                                        };
                                        components.tabs.watch.video.video_player.controls.details.$$[_id].hidden = true;
                                    }, {once: true})
                                }, 0);
                                setTimeout(() => {
                                    page.hidden = false;
                                }, 1);
                            }
                        }
                    }
                },
                $queue_active: null, // video id
                $queue: [],
                $_queue_active: () => components.tabs.watch.video.$queue.map(track=>track.id).indexOf(components.tabs.watch.video.$queue_active),
                $_clear_queue: () => components.tabs.watch.video.$queue = [],
                $_add_track: (track, is_active) => { /* Is added the track to queue */
                    let _return = false;
                    if(track == null) return false;
                    if(components.tabs.watch.video.$queue.filter(_track => _track.id == track.id)?.[0] == null) {
                        components.tabs.watch.video.$queue = [
                            ...components.tabs.watch.video.$queue,
                            track
                        ];
                        _return = true
                    } else {
                        _return = false;
                    };
                    if(is_active){
                        components.tabs.watch.video.$queue_active = track.id;
                    };
                    return _return;
                },
                $times: null,
                $_times: (description) => {
                    let times = description.match(/[0-9\:]+:[0-9]{2,}\ +[^\n]+/g);
                    if(times == null) { // Try another filter for timeline extraction
                        times = description.match(/[^\n]+\ +[0-9\:]+:[0-9]{2,}/g);
                    };
                    if(times == null){ // If still can not be extracted, return false
                        components.tabs.watch.video.$times = [];
                        return false;
                    };
                    components.tabs.watch.video.$times = times.map(text => {
                        let time = text.match(/[0-9\:]+:[0-9]{2,}/g)[0];
                        time = yt_extractor.utils.extract_time_from_text(time)
                        let details = text.replace(/[0-9:,-]/g,"").trim();
                        return [time, details];
                    });
                    return true;
                },
                $_theatre: () => {
                    if(components.tabs.watch.$.getAttribute("mode") == "theatre") {
                        components.tabs.watch.$.removeAttribute("mode");
                    } else {
                        components.tabs.watch.$.setAttribute("mode", "theatre");
                    }
                },
                $video: null,
                $audio: null,
                $hls: null,
                $video_audio_ctx: null,
                $audio_audio_ctx: null,
                $video_source: null,
                $audio_source: null,
                $video_gain_node: null,
                $audio_gain_node: null,
                $__pitch: 1,
                $__pitch_audio_process: (process_event) => {
                    let input_buffer = process_event.inputBuffer;
                    let output_buffer = process_event.outputBuffer;

                    for (let channel = 0; channel < input_buffer.numberOfChannels; channel++) {
                        let input_data = input_buffer.getChannelData(channel);
                        let output_data = output_buffer.getChannelData(channel);

                        for (let i = 0; i < output_buffer.length; i++) {
                            const j = i * components.tabs.watch.video.$__pitch;
                            const jf = Math.floor(j);
                            const delta = j - jf;
                            if (jf+1 < input_data.length) {
                                output_data[i] = (1 - delta) * input_data[jf] + delta * input_data[jf+1];
                            } else {
                                output_data[i] = 0;
                            }
                        }
                    }
                },
                $_pitch: (value) => {
                    if(value == components.tabs.watch.video.$__pitch) return;
                    if(value == 1){
                        components.tabs.watch.video.$__pitch = 1;
                        ["video", "audio"].forEach(which => {
                            components.tabs.watch.video[`$${which}_source`].disconnect();
                            components.tabs.watch.video[`$${which}_source`].connect(components.tabs.watch.video[`$${which}_gain_node`]);
                        });
                    } else {
                        components.tabs.watch.video.$__pitch = value;
                        ["video", "audio"].forEach(which => {
                            components.tabs.watch.video[`$${which}_source`].disconnect();
                            components.tabs.watch.video[`$${which}_source`].connect(components.tabs.watch.video[`$${which}_pitch_filter`]);
                        });
                    }
                },
                $video_pitch_filter: null,
                $audio_pitch_filter: null,
                $_init_audio_ctx: () => {
                    ["video", "audio"].forEach(which => {
                        components.tabs.watch.video[`$${which}_audio_ctx`] = new AudioContext();
                        components.tabs.watch.video[`$${which}_source`] = components.tabs.watch.video[`$${which}_audio_ctx`].createMediaElementSource(components.tabs.watch.video[`$${which}`]);
                        components.tabs.watch.video[`$${which}_gain_node`] = components.tabs.watch.video[`$${which}_audio_ctx`].createGain();
                        components.tabs.watch.video[`$${which}_gain_node`].gain.value = 1;

                        // TODO: @@@watch.mediaSession.pitch_buffer_size<int>(1||0|1|2|3) 0:256 / 1:1024 / 2:4096 / 3:16384
                        components.tabs.watch.video[`$${which}_pitch_filter`] = components.tabs.watch.video[`$${which}_audio_ctx`].createScriptProcessor(1024, 1, 1);
                        // [Deprecation] The ScriptProcessorNode is deprecated. Use AudioWorkletNode instead.
                        // I will switch to AudioWorkletNode if I able to change quantum size of AudioWorkletNode
                        // Default quantum size (mostly 128) is too low to apply pitch without harming audio
                        components.tabs.watch.video[`$${which}_pitch_filter`].onaudioprocess = components.tabs.watch.video.$__pitch_audio_process;

                        components.tabs.watch.video[`$${which}_source`].connect(components.tabs.watch.video[`$${which}_gain_node`]);
                        components.tabs.watch.video[`$${which}_pitch_filter`].connect(components.tabs.watch.video[`$${which}_gain_node`]); // The node will not affect audio until source connected to it.
                        components.tabs.watch.video[`$${which}_gain_node`].connect(components.tabs.watch.video[`$${which}_audio_ctx`].destination);
                    });
                },
                $_volume: (value) => {
                    components.tabs.watch.video.video_player.controls.volume_slider.value =
                    components.tabs.watch.video.$audio_gain_node.gain.value =
                    components.tabs.watch.video.$video_gain_node.gain.value = value;
                },
                $volume: () => {
                    return components.tabs.watch.video.$audio_gain_node.gain.value;
                },
                $listen: false,
                $audio_tracks: [],
                $video_tracks: [],
                $related_tracks: [],
                $is_playing: () => {
                    return !components.tabs.watch.video.$video.paused;
                },
                $_unload: async () => {
                    components.tabs.watch.video.$_pause();
                    components.tabs.watch.video.$video.removeAttribute("src");
                    components.tabs.watch.video.$audio.removeAttribute("src");
                    components.tabs.watch.video.$video.load();
                    components.tabs.watch.video.$audio.load();
                },
                $_pause: async () => {
                    await components.tabs.watch.video.$video.pause();
                    if(!components.tabs.watch.video.$listen) await components.tabs.watch.video.$audio.pause();
                },
                $_play: async () => {
                    components.tabs.watch.video.$audio.currentTime = components.tabs.watch.video.$video.currentTime;
                    await components.tabs.watch.video.$video.play();
                    if(!components.tabs.watch.video.$listen) await components.tabs.watch.video.$audio.play();
                },
                $_play_pause: () => {
                    if(components.tabs.watch.video.$is_playing()) {
                        components.tabs.watch.video.$_pause();
                    } else {
                        components.tabs.watch.video.$_play();
                    }
                },
                $speed: () => {
                    return components.tabs.watch.video.$video.playbackRate;
                },
                $_speed: async (value) => {
                    components.tabs.watch.video.$video.playbackRate =
                    components.tabs.watch.video.$audio.playbackRate = value;
                },
                $_next: async () => {
                    let next_video_id = components.tabs.watch.video.$queue[components.tabs.watch.video.$_queue_active()+1]?.id;
                    if(next_video_id != null) {
                        return render.watch(next_video_id);
                    };
                    next_video_id = components.tabs.watch.video.$queue[0]?.id;
                    if(next_video_id != null && false){ // TODO: loop enabled
                        return render.watch(next_video_id);
                    };
                },
                $_can_next: () => components.tabs.watch.video.$queue.length > 0 && (components.tabs.watch.video.$_queue_active() + 1 < components.tabs.watch.video.$queue.length || false /* TODO: loops enabled */),
                $_previous: async () => {
                    let next_video_id = components.tabs.watch.video.$queue[components.tabs.watch.video.$_queue_active() - 1]?.id;
                    if(next_video_id != null) {
                        return render.watch(next_video_id);
                    };
                },
                $_can_previous: () => components.tabs.watch.video.$_queue_active() > 0,
                $_seekto: async time => {
                    components.tabs.watch.video.$video.currentTime = time;
                    if(!components.tabs.watch.video.$listen) components.tabs.watch.video.$audio.currentTime = time;
                },
                $current_time: () => {
                    return components.tabs.watch.video.$video.currentTime;
                },
                $_seekby: async time => {
                    components.tabs.watch.video.$_seekto(
                        components.tabs.watch.video.$current_time() + time
                    );
                },
                $muted: () => {
                    return components.tabs.watch.video.$audio.muted;
                },
                $_mute: (state) => {
                    if(state != undefined){
                        components.tabs.watch.video.$video.muted =
                        components.tabs.watch.video.$audio.muted = state;
                    } else {
                        components.tabs.watch.video.$video.muted =
                        components.tabs.watch.video.$audio.muted = !components.tabs.watch.video.$audio.muted;
                    };
                    components.tabs.watch.video.video_player.controls.volume.innerText = ["volume_up", "volume_off"][Number(components.tabs.watch.video.$audio.muted)];
                },
                $_listen: (state) => {
                    if(components.tabs.watch.video.$hls != null) return; // If live stream
                    if(state == components.tabs.watch.video.$listen) return;
                    if(state == undefined) state = !components.tabs.watch.video.$listen;
                    components.tabs.watch.video.$listen = state;
                    let playing_state = components.tabs.watch.video.$_get_state();
                    components.tabs.watch.video.$_pause();
                    components.tabs.watch.video.$video.addEventListener("load", () => {
                        components.tabs.watch.video.$_apply_state(playing_state);
                    }, {once:true});
                    if(state == true){
                        components.tabs.watch.video.$video.src = components.tabs.watch.video.$audio.src;
                        components.tabs.watch.video.$audio.removeAttribute("src");
                        components.tabs.watch.video.$audio.load();
                        components.tabs.watch.video.$_apply_state(playing_state);
                    } else {
                        components.tabs.watch.video.$video.addEventListener("load", () => {
                            components.tabs.watch.video.$_apply_state(playing_state);
                        }, {once:true});
                        components.tabs.watch.video.$video.addEventListener("canplay", () => {
                            components.tabs.watch.video.$_apply_state(playing_state);
                        }, {once:true});
                        components.tabs.watch.video.$_change_stream("audio", -1);
                        components.tabs.watch.video.$_change_stream("video", -1);
                        components.tabs.watch.video.$_apply_state(playing_state);
                    };
                },
                $_share: async () => {
                    components.share.$_share("https://youtube.com/watch?v="+components.tabs.watch.$$response.id);
                },
                $_get_state: () => {
                    return ({
                        is_playing: components.tabs.watch.video.$is_playing(),
                        current_time: components.tabs.watch.video.$current_time(),
                        speed: components.tabs.watch.video.$speed()
                    });
                },
                $_apply_state: async (state) => {
                    if(state.is_playing) {
                        await components.tabs.watch.video.$_play();
                    } else {
                        await components.tabs.watch.video.$_pause();
                    };
                    await components.tabs.watch.video.$_speed(state.speed);
                    components.tabs.watch.video.$_seekto(state.current_time);
                },
                $_change_stream: async (type, id) => {
                    if(!(type == "video" || type == "audio")) return;
                    if(components.tabs.watch.video.$hls == null){
                        let state = components.tabs.watch.video.$_get_state();
                        components.tabs.watch.video.$_pause();

                        let url = components.tabs.watch.video[`$${type}_tracks`].at(id).url;
                        if(components.tabs.watch.video.$listen) { // If video disabled
                            if(type == "video") {
                                return components.tabs.watch.video.$_apply_state(state);
                            };
                            type = "video";
                        };
                        components.tabs.watch.video[`$${type}`].src = await yt_extractor.video.get_real_stream_uri(url);
                        components.tabs.watch.video.$_apply_state(state);
                    } else { // It's a live video, so give control to hls.js
                        components.tabs.watch.video.$hls.currentLevel = Number(id);
                    }
                },
                $_fullscreen: async () => {
                    if(document.fullscreenElement != components.tabs.watch.video.video_player.$){
                        if(document.fullscreenElement != null) {
                            document.exitFullscreen();
                        };
                        components.tabs.watch.video.video_player.$.requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    };
                },
                $captions: {
                    $_remove: () => {
                        Array.from(components.tabs.watch.video.$video.textTracks).filter(tracks => tracks.mode == "showing").map(track => track.mode = "hidden");
                    },
                    $_load: {
                        $_ttml: async (content) => {
                            components.tabs.watch.video.$captions.$_remove();
                            let subtitles = (new DOMParser()).parseFromString(content, "application/xml");
                            let texts = subtitles.querySelectorAll("*[start][dur]");
                            let track = components.tabs.watch.video.$video.addTextTrack("captions");
                            track.mode = "showing";

                            for(let text_index = 0; text_index < texts.length; text_index++){
                                let text = texts[text_index];
                                let nodes = text.childNodes;
                                let caption_text = "";
                                for(let node_index in nodes){
                                    let the_node = nodes[node_index];
                                    switch(the_node.nodeName){
                                        case "#text":{
                                            caption_text += the_node.nodeValue;
                                            break;
                                        } case "br": {
                                            caption_text += "\n";
                                            break;
                                        }
                                    }
                                };

                                let start = Number(text.getAttribute("start"));
                                let end = start + Number(text.getAttribute("dur"));
                                let cue = new VTTCue(start, end, caption_text);
                                cue.line = -4;
                                track.addCue(cue);
                            };
                        },
                        $: async (id) => {
                            components.tabs.watch.video.$captions.$_remove();
                            let url = components.tabs.watch.$$response.captions[id].baseUrl;
                            let response = await fetch(url);
                            let content = await response.text();
                            components.tabs.watch.video.$captions.$_load.$_ttml(content);
                        }
                    }
                },
                $pip: {
                    $is_pip: false,
                    $_window: null,
                    $_load_state: () => {},
                    $_create_pip: () => {
                        if(components.tabs.watch.video.$pip.$is_pip) return;
                        components.tabs.watch.video.$pip.$is_pip = true;
                        let _window = window.open('./pip.html', '', 'width=480,height=270,scrollbars=0,resizable=1,frame=0');
                        components.tabs.watch.video.$pip.$_window = _window.window;
                        components.tabs.watch.video.$pip.$_window.addEventListener("DOMContentLoaded", () => {
	                        components.tabs.watch.video.$pip.$_window.electron = electron;
	                        components.tabs.watch.video.$pip.$_window.electron_loaded();
                            components.tabs.watch.video.$_pause();
                            components.tabs.watch.video.$pip.$_window.document.body.querySelector(".video-container").append(components.tabs.watch.video.$video);
                            components.tabs.watch.video.$pip.$_load_state();
                            components.tabs.watch.video.$pip.$_window.addEventListener("unload", () => {
                                components.tabs.watch.video.$pip.$toggle(false);
                            });
                        });
                    },
                    $_deattach_video: () => {
                        if(!components.tabs.watch.video.$pip.$is_pip) return;
                        components.tabs.watch.video.$pip.$is_pip = false;
                        components.tabs.watch.video.$_pause();
                        document.querySelector(".primary-flow .video-player").insertAdjacentElement("afterbegin", components.tabs.watch.video.$video);
                        components.tabs.watch.video.$pip.$_load_state();
                        if(!components.tabs.watch.video.$pip.$_window.closed) {
                            components.tabs.watch.video.$pip.$_window.close();
                        }
                    },
                    $toggle: (is_toggle=null) => {
                        if(components.tabs.watch.video.$hls != null){ // If it's live stream
                            // Use electron pip since hls.js is incompatible with NewFlow pip.
                            components.tabs.watch.video.$video.requestPictureInPicture();
                        }
                        let playing_state = components.tabs.watch.video.$_get_state();
                        if(is_toggle == null){
                            is_toggle = !components.tabs.watch.video.$pip.$is_pip;
                        };
                        components.tabs.watch.video.$pip.$_load_state = (_playing_state = playing_state) => {
                            components.tabs.watch.video.$_apply_state(_playing_state);
                        };
                        if(is_toggle){
                            components.tabs.watch.video.$pip.$_create_pip();
                        } else {
                            components.tabs.watch.video.$pip.$_deattach_video();
                        };
                    }
                }
            },
            comments: null,
            next_videos: null,
            panels: {
                $: null,
                autoplay: null,
                playing_queue: null
            },
            info: {
                $: null,
                title: null,
                description: null,
                keywords: null,
                owner: {
                    $: null,
                    thumbnail: null,
                    name: null,
                    followers: null,
                    follow: null
                },
                controls: {
                    $: null,
                    like: null,
                    playlist_add: null,
                    listen: null,
                    pip: null,
                    download: null,
                    share: null
                }
            }
        },
        trends: {
            $: null
        },
        search: {
            $: null
        },
        owner: {
            $: null,
            $$response: null,
            banner: {
                $: null,
                background: null,
                thumbnail: null,
                name: null,
                description: null,
                followers: null,
                video_count: null,
                follow: null,
            },
            videos: null
        },
        history: {
            $: null
        },
        following: {
            $: null
        },
        feed: {
            $: null
        },
        offline: {
            $: null
        },
        queue: {
            $: null,
            queue: null,
            controls: {
                previous: null,
                play_pause: null,
                next: null
            }
        },
        downloads: {
            $: null,
            $list: [],
            $_download: async (uri, properties) => {
                /* properties:
                 *  title
                 *  thumbnail
                 *  owner_name
                 *  length
                 *  id
                 */
                let dialog = await electron.dialog.showSaveDialog(components.$.$_window, {title: "NewFlow", buttonLabel:"Download", defaultPath:components.$_convert_to_save_chars(properties?.title ?? "download")+".mp4"});
                if(dialog.canceled) return;
                let downloading_file = downloader.download(uri, dialog.filePath);
                downloading_file.properties = properties;
                components.tabs.downloads.$list = [downloading_file, ...components.tabs.downloads.$list];
            },
            $sync: null,
            $_sync: () => {
                components.tabs.downloads.$_clear_sync();
                components.tabs.downloads.$sync = setInterval(() => {
                    if(components.tabs.$.getAttribute("active") != "downloads" || !components.tabs.downloads.$list.map(a=>a.state!="finish").includes(true)) return components.tabs.downloads.$_clear_sync();
                    render.downloads();
                }, 75);
            },
            $_clear_sync: () => {
                clearInterval(components.tabs.downloads.$sync);
            }
        },
        playlists: {
            $: null
        }
    }
};

// Define sub components

components.titlebar.title = components.titlebar.$.querySelector(".title");
components.titlebar.search.$ = components.titlebar.$.querySelector("input.search");
components.titlebar.search.datalist = document.querySelector("datalist.search#suggestions");
components.titlebar.minimize = components.titlebar.$.querySelector("button.minimize");
components.titlebar.maximize = components.titlebar.$.querySelector("button.maximize");
components.titlebar.close = components.titlebar.$.querySelector("button.close");
components.titlebar.button_layout = components.titlebar.$.querySelector(".button-layout");
components.titlebar.menu = components.titlebar.$.querySelector("button.menu");

// Window controls

components.titlebar.minimize.addEventListener("click", () => {
    components.$.$_window.minimize();
});

components.titlebar.maximize.addEventListener("click", () => {
    if(components.$.$_window.isMaximized()) {
        components.$.$_window.unmaximize();
    } else {
        components.$.$_window.maximize();
    }
});

components.titlebar.maximize.setAttribute("state", ["maximize","restore"][Number(components.$.$_window.isMaximized())]);

components.titlebar.close.addEventListener("click", () => {
    components.$.$_window.close();
});

components.titlebar.menu.addEventListener("click", event => {
    if(!components.sidenav.$.hasAttribute("open")){
        components.sidenav.$.setAttribute("open", true);
        event.stopPropagation();

        let abort_controller = new AbortController();
        document.addEventListener("click", (_, __abort_controller=abort_controller) => {
            components.sidenav.$.removeAttribute("open");
            __abort_controller.abort();
        }, {signal: abort_controller.signal});
    }
});

document.body.setAttribute("os", components.$.$_os);

if(process.argv.includes("--newflow-system-titlebar")){
    components.titlebar.button_layout.style.display = "none";
};

if(components.$.$_os == "linux"){
    window.addEventListener("DocumentReady", async () => {
        // TODO: @@@titlebar.buttonLayout.useSystemLayout<bool>(true||false|true)
        try {
            let output = String(child_process.execSync("gsettings get org.gnome.desktop.wm.preferences button-layout"));
            let extracted_layout = output.match("\'[a-zA-Z\,\:]+\'")[0].slice(1,-1);
            let layout = extracted_layout.split(":")[1].split(",").filter(k => k == "minimize" || k == "maximize" || k == "close");
            components.titlebar.button_layout.setAttribute("custom", true);
            layout.forEach((button, index) => {
                components.titlebar[button].style.order = index;
                components.titlebar[button].setAttribute("show", true);
            });
        } catch {
            console.warn("Unable to get button-layout");
        }

        // TODO: @@@titlebar.buttonLayout.kdeSession<bool>(true||false|true)
        try {
            let output = String(child_process.execSync("echo -n $KDE_SESSION_VERSION"));
            if(output != "") {
                // Use KDE variant
                components.titlebar.button_layout.setAttribute("variant", "kde");
            } // else { Use default Linux (Ubuntu-Yaru) variant }
        } catch {
            console.warn("Unable to get button-layout");
        }
    });
};

components.titlebar.search.$.addEventListener("keydown", event => {
    if(event.key == "Enter"){
        render.search(components.titlebar.search.$.value);
        components.titlebar.search.$.blur();
        clearTimeout(components.titlebar.search.$timeout);
    } else {
        clearTimeout(components.titlebar.search.$timeout);
        components.titlebar.search.$timeout = setTimeout(async () => {
            if(components.titlebar.search.$.value.length == 0 || components.titlebar.search.$last_search == components.titlebar.search.$.value.trim()) return;
            components.titlebar.search.$_clear();
            components.titlebar.search.$last_search = components.titlebar.search.$.value.trim();
            let list = await yt_extractor.search.get_suggestions(components.titlebar.search.$last_search);
            components.titlebar.search.$_load(list);
        }, 500);
    }
});

components.global_actions.search.addEventListener("click", () => {
    components.titlebar.search.$.focus();
});

components.$.$_window.on("maximize", () => {
    components.titlebar.maximize.setAttribute("state", "restore");
});

components.$.$_window.on("unmaximize", () => {
    components.titlebar.maximize.setAttribute("state", "maximize");
});

// Continue to Define sub components

components.sidenav.devtools = components.sidenav.$.querySelector(".devtools");
components.playbar.title = components.playbar.$.querySelector(".title");
components.playbar.owner = components.playbar.$.querySelector(".owner");
components.playbar.thumbnail = components.playbar.$.querySelector("img.thumbnail");
components.playbar.controls.$ = components.playbar.$.querySelector(".controls");
components.playbar.controls.queue = components.playbar.controls.$.querySelector(".queue");
components.playbar.controls.play_pause = components.playbar.controls.$.querySelector(".play-pause");
components.playbar.controls.close = components.playbar.controls.$.querySelector(".close");
components.share.actions.close = components.share.$.querySelector(".close");
components.share.actions.twitter_x = components.share.$.querySelector(".twitter-x");
components.share.actions.whatsapp = components.share.$.querySelector(".whatsapp");
components.share.actions.telegram = components.share.$.querySelector(".telegram");
components.share.actions.copy_link = components.share.$.querySelector(".copy-link");
components.share.actions.open_in_browser = components.share.$.querySelector(".open-in-browser");
components.tabs.watch.$ = components.tabs.$.querySelector("#watch");
components.tabs.watch.video.$video = components.tabs.watch.$.querySelector("video");
components.tabs.watch.video.$audio = components.tabs.watch.$.querySelector("audio");
components.tabs.watch.video.video_player.$ = components.tabs.watch.$.querySelector(".video-player");
components.tabs.watch.video.video_player.thumbnail = components.tabs.watch.video.video_player.$.querySelector("img.thumbnail");
components.tabs.watch.video.video_player.stream_date.$ = components.tabs.watch.video.video_player.$.querySelector(".stream-start-date");
components.tabs.watch.video.video_player.stream_date.date = components.tabs.watch.video.video_player.stream_date.$.querySelector(".date");
components.tabs.watch.video.video_player.controls.$ = components.tabs.watch.video.video_player.$.querySelector(".controls");
components.tabs.watch.video.video_player.controls.previous = components.tabs.watch.video.video_player.controls.$.querySelector(".previous");
components.tabs.watch.video.video_player.controls.backward = components.tabs.watch.video.video_player.controls.$.querySelector(".backward");
components.tabs.watch.video.video_player.controls.play_pause = components.tabs.watch.video.video_player.controls.$.querySelector(".play-pause");
components.tabs.watch.video.video_player.controls.forward = components.tabs.watch.video.video_player.controls.$.querySelector(".forward");
components.tabs.watch.video.video_player.controls.next = components.tabs.watch.video.video_player.controls.$.querySelector(".next");
components.tabs.watch.video.video_player.controls.volume = components.tabs.watch.video.video_player.controls.$.querySelector(".volume");
components.tabs.watch.video.video_player.controls.volume_slider = components.tabs.watch.video.video_player.controls.$.querySelector(".volume-slider");
components.tabs.watch.video.video_player.controls.speed = components.tabs.watch.video.video_player.controls.$.querySelector(".speed");
components.tabs.watch.video.video_player.controls.more = components.tabs.watch.video.video_player.controls.$.querySelector(".more");
components.tabs.watch.video.video_player.controls.timelines = components.tabs.watch.video.video_player.controls.$.querySelector(".timelines");
components.tabs.watch.video.video_player.controls.theatre = components.tabs.watch.video.video_player.controls.$.querySelector(".theatre");
components.tabs.watch.video.video_player.controls.captions = components.tabs.watch.video.video_player.controls.$.querySelector(".captions");
components.tabs.watch.video.video_player.controls.fullscreen = components.tabs.watch.video.video_player.controls.$.querySelector(".fullscreen");
components.tabs.watch.video.video_player.controls.time_slider = components.tabs.watch.video.video_player.$.querySelector(".time-slider");
components.tabs.watch.video.video_player.controls.time_info.$ = components.tabs.watch.video.video_player.$.querySelector(".time-info");
components.tabs.watch.video.video_player.controls.time_info.current_time = components.tabs.watch.video.video_player.controls.time_info.$.querySelector(".current-time");
components.tabs.watch.video.video_player.controls.time_info.duration = components.tabs.watch.video.video_player.controls.time_info.$.querySelector(".duration");
components.tabs.watch.video.video_player.controls.details.$$.speed = components.tabs.watch.video.video_player.$.querySelector(".details.speed");
components.tabs.watch.video.video_player.controls.details.$$.captions = components.tabs.watch.video.video_player.$.querySelector(".details.captions");
components.tabs.watch.video.video_player.controls.details.$$.more = components.tabs.watch.video.video_player.$.querySelector(".details.more");
components.tabs.watch.video.video_player.controls.details.$$.filter = components.tabs.watch.video.video_player.$.querySelector(".details.filter");
components.tabs.watch.video.video_player.controls.details.$$.timelines = components.tabs.watch.video.video_player.$.querySelector(".details.timelines");
components.tabs.watch.video.video_player.controls.details.$$.video_quality = components.tabs.watch.video.video_player.$.querySelector(".details.video-quality");
components.tabs.watch.video.video_player.controls.details.$$.audio_quality = components.tabs.watch.video.video_player.$.querySelector(".details.audio-quality");
components.tabs.watch.video.video_player.controls.details.$$.audio_pitch = components.tabs.watch.video.video_player.$.querySelector(".details.audio-pitch");
components.tabs.watch.comments = components.tabs.watch.$.querySelector(".comments");
components.tabs.watch.next_videos = components.tabs.watch.$.querySelector(".next-videos");
components.tabs.watch.panels.$ = components.tabs.watch.$.querySelector(".panels");
components.tabs.watch.panels.autoplay = components.tabs.watch.panels.$.querySelector("input.autoplay");
components.tabs.watch.panels.playing_queue = components.tabs.watch.panels.$.querySelector("div.playing-queue");
components.tabs.watch.info.$ = components.tabs.watch.$.querySelector(".info");
components.tabs.watch.info.title = components.tabs.watch.info.$.querySelector(".title");
components.tabs.watch.info.description = components.tabs.watch.info.$.querySelector(".description");
components.tabs.watch.info.owner.$ = components.tabs.watch.info.$.querySelector(".owner");
components.tabs.watch.info.owner.thumbnail = components.tabs.watch.info.owner.$.querySelector(".thumbnail");
components.tabs.watch.info.owner.name = components.tabs.watch.info.owner.$.querySelector(".name");
components.tabs.watch.info.owner.followers = components.tabs.watch.info.owner.$.querySelector(".followers");
components.tabs.watch.info.owner.follow = components.tabs.watch.info.owner.$.querySelector("material-symbol.follow");
components.tabs.watch.info.keywords = components.tabs.watch.info.$.querySelector(".keywords");
components.tabs.watch.info.controls.$ = components.tabs.watch.info.$.querySelector(".controls");
components.tabs.watch.info.controls.like = components.tabs.watch.info.controls.$.querySelector(".like");
components.tabs.watch.info.controls.playlist_add = components.tabs.watch.info.controls.$.querySelector(".playlist-add");
components.tabs.watch.info.controls.listen = components.tabs.watch.info.controls.$.querySelector(".listen");
components.tabs.watch.info.controls.pip = components.tabs.watch.info.controls.$.querySelector(".pip");
components.tabs.watch.info.controls.download = components.tabs.watch.info.controls.$.querySelector(".download");
components.tabs.watch.info.controls.share = components.tabs.watch.info.controls.$.querySelector(".share");
components.tabs.trends.$ = components.tabs.$.querySelector("#trends");
components.tabs.owner.$ = components.tabs.$.querySelector("#owner");
components.tabs.owner.banner.$ = components.tabs.owner.$.querySelector(".banner");
components.tabs.owner.banner.background = components.tabs.owner.banner.$.querySelector(".background");
components.tabs.owner.banner.description = components.tabs.owner.banner.$.querySelector(".description");
components.tabs.owner.banner.followers = components.tabs.owner.banner.$.querySelector(".followers");
components.tabs.owner.banner.name = components.tabs.owner.banner.$.querySelector(".name");
components.tabs.owner.banner.thumbnail = components.tabs.owner.banner.$.querySelector(".thumbnail");
components.tabs.owner.banner.video_count = components.tabs.owner.banner.$.querySelector(".video_count");
components.tabs.owner.banner.follow = components.tabs.owner.banner.$.querySelector(".follow");
components.tabs.owner.videos = components.tabs.owner.$.querySelector(".videos");
components.tabs.search.$ = components.tabs.$.querySelector("#search");
components.tabs.history.$ = components.tabs.$.querySelector("#history");
components.tabs.following.$ = components.tabs.$.querySelector("#following");
components.tabs.feed.$ = components.tabs.$.querySelector("#feed");
components.tabs.downloads.$ = components.tabs.$.querySelector("#downloads");
components.tabs.offline.$ = components.tabs.$.querySelector("#offline");
components.tabs.queue.$ = components.tabs.$.querySelector("#queue");
components.tabs.playlists.$ = components.tabs.$.querySelector("#playlists");

// Add event listeners

Array.from(components.sidenav.$.childNodes).filter(tab => tab?.hasAttribute?.("tab")).forEach(tab => {
    tab.addEventListener("click", event => {
        let tab_name = event.target.getAttribute("tab");
        components.tabs.$.setAttribute("active", tab_name);
        if(components.sidenav.$handlers[tab_name]) {
            components.sidenav.$handlers[tab_name]();
        }
    })
});

components.share.actions.close.addEventListener("click", components.share.$_close);
components.share.actions.twitter_x.addEventListener("click", console.warn);
components.share.actions.whatsapp.addEventListener("click", console.warn);
components.share.actions.telegram.addEventListener("click", console.warn);
components.share.actions.copy_link.addEventListener("click", console.warn);
components.share.actions.open_in_browser.addEventListener("click", console.warn);

components.playbar.$.addEventListener("click", event => {
    if(event.target.tagName.toLowerCase()!="button"){
        components.tabs.$_switch("watch");
    };
});

components.playbar.controls.play_pause.addEventListener("click", components.tabs.watch.video.$_play_pause);
components.playbar.controls.close.addEventListener("click", components.tabs.watch.video.$_unload);
components.tabs.watch.video.$_init_audio_ctx();
components.tabs.watch.video.$video.addEventListener("pause", () => {
    components.tabs.watch.video.$_pause();
    if(components.tabs.watch.video.$video.currentTime == components.tabs.watch.video.$video.duration) {
        components.tabs.watch.video.video_player.controls.play_pause.innerText = "replay";
        components.playbar.controls.play_pause.innerText = "replay";
        // TODO: autoplay
        components.tabs.watch.video.$_next();
    } else {
        components.tabs.watch.video.video_player.controls.play_pause.innerText = "play_arrow";
        components.playbar.controls.play_pause.innerText = "play_arrow";
    };
    render.$.thumbar_buttons(false);
});
components.playbar.controls.queue.addEventListener("click", () => {
    components.tabs.$_switch("queue");
});
components.tabs.watch.video.$video.addEventListener("play", () => {
    components.tabs.watch.video.$_play();
    components.tabs.watch.video.video_player.controls.play_pause.innerText = "pause";
    components.playbar.controls.play_pause.innerText = "pause";
    render.$.thumbar_buttons(true);
});
components.tabs.watch.video.$video.addEventListener("durationchange", () => {
    components.tabs.watch.video.video_player.controls.time_info.duration.innerText = components.$_human_readable_time(components.tabs.watch.video.$video.duration);
    components.tabs.watch.video.video_player.controls.time_slider.max = components.tabs.watch.video.$video.duration;
});
components.tabs.watch.video.$video.addEventListener("timeupdate", async event => {
    if(Math.abs(event.target.currentTime - components.tabs.watch.video.$audio.currentTime) > 0.1) {
        components.tabs.watch.video.$audio.currentTime = event.target.currentTime;
    };
    components.tabs.watch.video.video_player.controls.time_info.current_time.innerText = components.$_human_readable_time(components.tabs.watch.video.$video.currentTime);
    components.tabs.watch.video.video_player.controls.time_slider.value = components.tabs.watch.video.$video.currentTime;
});

components.tabs.watch.video.$video.addEventListener("waiting", () => {
    components.tabs.watch.video.$video.setAttribute("loading", true);
});
components.tabs.watch.video.$video.addEventListener("canplay", () => {
    components.tabs.watch.video.$video.setAttribute("loading", false);
});

navigator.mediaSession.setActionHandler("play", components.tabs.watch.video.$_play);
navigator.mediaSession.setActionHandler("pause", components.tabs.watch.video.$_pause);
navigator.mediaSession.setActionHandler("nexttrack", components.tabs.watch.video.$_next);
navigator.mediaSession.setActionHandler("previoustrack", components.tabs.watch.video.$_previous);
navigator.mediaSession.setActionHandler("seekto", event => {
    components.tabs.watch.video.$_seekto(event.seekTime);
});
navigator.mediaSession.setActionHandler("seekbackward", () => {
    components.tabs.watch.video.$_seekby(-5);
});
navigator.mediaSession.setActionHandler("seekforward", () => {
    components.tabs.watch.video.$_seekby(5);
});
navigator.mediaSession.setActionHandler("stop", () => {
    // STOP IS PAUSES AUDIO ANYWAY
    components.tabs.watch.video.$_pause();
});

components.tabs.watch.video.video_player.controls.previous.addEventListener("click", components.tabs.watch.video.$_previous);
components.tabs.watch.video.video_player.controls.play_pause.addEventListener("click", components.tabs.watch.video.$_play_pause);
components.tabs.watch.video.video_player.controls.next.addEventListener("click", components.tabs.watch.video.$_next);
components.tabs.watch.video.video_player.controls.speed.addEventListener("click", () => {
    components.tabs.watch.video.video_player.controls.details.toggle("speed");
});
components.tabs.watch.video.video_player.controls.backward.addEventListener("click", () => {
    components.tabs.watch.video.$_seekby(-10);
})
components.tabs.watch.video.video_player.controls.forward.addEventListener("click", () => {
    components.tabs.watch.video.$_seekby(10);
})
components.tabs.watch.video.video_player.controls.captions.addEventListener("click", () => {
    components.tabs.watch.video.video_player.controls.details.toggle("captions");
});
components.tabs.watch.video.video_player.controls.theatre.addEventListener("click", () => {
    components.tabs.watch.video.$_theatre();
});
components.tabs.watch.video.video_player.controls.timelines.addEventListener("click", () => {
    components.tabs.watch.video.video_player.controls.details.toggle("timelines");
});
components.tabs.watch.video.video_player.controls.volume.addEventListener("click", () => {
    components.tabs.watch.video.$_mute();
});
components.tabs.watch.video.video_player.controls.volume_slider.addEventListener("input", () => {
    if(components.tabs.watch.video.$muted()){
        components.tabs.watch.video.$_mute(false);
    };
    components.tabs.watch.video.$_volume(components.tabs.watch.video.video_player.controls.volume_slider.value);
});
components.tabs.watch.video.video_player.controls.more.addEventListener("click", () => {
    components.tabs.watch.video.video_player.controls.details.toggle("more");
});
components.tabs.watch.video.video_player.controls.fullscreen.addEventListener("click", components.tabs.watch.video.$_fullscreen);
components.tabs.watch.video.video_player.controls.time_slider.addEventListener("input", () => {
    components.tabs.watch.video.$_seekto(components.tabs.watch.video.video_player.controls.time_slider.value);
});

Array.from(components.tabs.watch.video.video_player.controls.details.$$.filter.querySelectorAll("input[css-target]")).forEach(element => {
    element.addEventListener("input", event => {
        components.tabs.watch.video.$video.style.setProperty(event.target.getAttribute("css-target"), event.target.value + (event.target.getAttribute("suffix") ?? ""));
    });
});
components.tabs.watch.video.video_player.controls.details.$$.filter.querySelector("button").addEventListener("click", () => {
    Array.from(components.tabs.watch.video.video_player.controls.details.$$.filter.querySelectorAll("input[css-target]")).forEach(element => {
        element.value = element.getAttribute("default-value");
    });
    components.tabs.watch.video.$video.setAttribute("style", "");
});

components.tabs.watch.info.owner.$.addEventListener("click", (event) => {
    if(event.target.className == "follow") return;
    render.owner(components.tabs.watch.$$response.owner.id);
});

components.tabs.watch.info.owner.follow.addEventListener("click", async () => {
    if(!database.following.is_following(components.tabs.watch.$$response.owner.id)){ // If not following yet
        components.tabs.watch.info.owner.follow.innerText = "notifications_active";
        database.following.add({
            id: components.tabs.watch.$$response.owner.id,
            name: components.tabs.watch.$$response.owner.name,
            followers: components.tabs.watch.$$response.owner.followers,
            verified: components.tabs.watch.$$response.owner.verified,
            thumbnail: await image_helper.data_uri.from_image_uri(components.tabs.watch.$$response.owner.thumbnails[0].url),
        });
    } else {
        components.tabs.watch.info.owner.follow.innerText = "notifications";
        database.following.remove(components.tabs.watch.$$response.owner.id);
    }
});

components.tabs.watch.info.controls.like.addEventListener("click", console.warn);
components.tabs.watch.info.controls.playlist_add.addEventListener("click", console.warn);
components.tabs.watch.info.controls.listen.addEventListener("click", () => {
    components.tabs.watch.video.$_listen();
});
components.tabs.watch.info.controls.pip.addEventListener("click", () => {
    components.tabs.watch.video.$pip.$toggle();
});
components.tabs.watch.info.controls.download.addEventListener("click", async () => {
    if(components.tabs.watch.video.$hls != null) {
        return await electron.dialog.showMessageBox({message:"Live Streams can not be downloaded", type:"warning"});
    };
    if(components.tabs.watch.$$response.relatedStreams.length == 0) {
        return await electron.dialog.showMessageBox({message:"No related stream can not be found.\nTry again later.", type:"warning"});
    }
    components.tabs.downloads.$_download(await yt_extractor.video.get_real_stream_uri(components.tabs.watch.$$response.relatedStreams[0].url), {
        title: components.tabs.watch.$$response.title,
        thumbnail: components.tabs.watch.$$response.thumbnails[0].url,
        owner_name: components.tabs.watch.$$response.owner.name,
        length: components.tabs.watch.$$response.length,
        id: components.tabs.watch.$$response.id
    });
});
components.tabs.watch.info.controls.share.addEventListener("click", () => {
    components.tabs.watch.video.$_share();
});

components.tabs.owner.banner.follow.addEventListener("click", async () => {
    if(!database.following.is_following(components.tabs.owner.$$response.id)){ // If not following yet
        components.tabs.owner.banner.follow.innerText = "notifications_active";
        database.following.add({
            id: components.tabs.owner.$$response.id,
            name: components.tabs.owner.$$response.name,
            followers: components.tabs.owner.$$response.followers,
            verified: components.tabs.owner.$$response.verified,
            thumbnail: await image_helper.data_uri.from_image_uri(components.tabs.owner.$$response.thumbnails[0].url),
        });
    } else {
        components.tabs.owner.banner.follow.innerText = "notifications";
        database.following.remove(components.tabs.owner.$$response.id);
    }
});

document.addEventListener("fullscreenchange", () => {
    if(document.fullscreenElement == components.tabs.watch.video.video_player.$){
        components.tabs.watch.video.video_player.controls.fullscreen.innerText = "fullscreen_exit";
    } else {
        components.tabs.watch.video.video_player.controls.fullscreen.innerText = "fullscreen";
    }
});

navigator.connection.addEventListener("change", () => {
    if(!navigator.onLine){
        components.tabs.$_switch("offline");
    }
});
if(!navigator.onLine) navigator.connection.dispatchEvent(new CustomEvent("change"));

/* Mount for accessing from PiP window, don't use for code that runs at main window */
components.tabs.watch.video.$video.$$$video = components.tabs.watch.video;

// Add DevTools button

if(components.$.$_debug) {
    components.sidenav.devtools.style.display = "";
    components.sidenav.devtools.addEventListener("click", () => {
        components.$.$_window.openDevTools();
    });
}

// Init Context Menu

//context_menu.init();

// Render trends
render.trends();

// Load theme and materials
// TODO: Move these code to settings

document.body.setAttribute("theme", window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    document.body.setAttribute("theme", event.matches ? "dark" : "light");
});

switch(window.process.argv.filter(arg => arg.startsWith("--newflow-material="))?.[0]?.split("=")?.[1] ?? "default") {
    case "mica": {
        document.body.setAttribute("material", "win-material");
        components.$.$_window.setBackgroundMaterial("mica");
        break;
    };
    case "acrylic": {
        document.body.setAttribute("material", "win-material");
        components.$.$_window.setBackgroundMaterial("acrylic");
        break;
    };
    case "noise": {
        document.body.setAttribute("material", "noise");
        break;
    };
}

// Extract YouTube algorithm for fast-loading

if(!components.$.$_debug) yt_extractor.video.extract_youtube_algorithm();
