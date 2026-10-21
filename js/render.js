var render = {
    $: {
        video_preview: (mode="normal", video_info) => { /* mode=normal|compact */
            /* video_info
             *  thumbnail
             *  owner.name
             *  owner.verified
             *  length
             *  title
             *  id
             */
            let video = document.createElement("div");
            video.className = mode + " -video-preview";
            let thumbnail = document.createElement("img");
            thumbnail.draggable = false;
            thumbnail.loading = "lazy";
            thumbnail.src = video_info?.thumbnail ?? "";
            video.append(thumbnail);
            let owner = document.createElement("span");
            owner.className = "owner";
            owner.innerText = video_info?.owner?.name ?? "";
            owner.setAttribute("verified", video_info?.owner?.verified ?? false);
            video.append(owner);
            let length = document.createElement("span");
            length.className = "length";
            length.setAttribute("length", video_info?.length ?? 0);
            length.innerText = components.$_human_readable_time(video_info?.length ?? 0);
            video.append(length);
            let title = document.createElement("span");
            title.className = "title";
            title.innerText = video_info?.title;
            video.append(title);
            video.addEventListener("click", (_, _id=video_info?.id, keep_queue=video_info?.keep_queue) => {
                if(keep_queue != true){
                    components.tabs.watch.video.$_clear_queue();
                }
                components.tabs.$_switch("watch");
                render.watch(_id);
            })
            return video;
        },
        playlist_preview: (mode="normal", playlist_info) => { /* mode=normal|compact */
            /* playlist_info
             *  title
             *  thumbnail
             *  id
             */
            let playlist = document.createElement("div");
            playlist.className = mode + " -playlist-preview";
            let thumbnail = document.createElement("img");
            thumbnail.draggable = false;
            thumbnail.loading = "lazy";
            thumbnail.src = playlist_info?.thumbnail ?? "";
            playlist.append(thumbnail);
            let title = document.createElement("span");
            title.className = "title";
            title.innerText = playlist_info?.title;
            playlist.append(title);
            playlist.addEventListener("click", (_, _id=playlist_info?.id) => {
                alert(_id);
            })
            return playlist;
        },
        owner_preview: (mode="normal", owner_info) => { /* mode=normal|compact */
            let owner = document.createElement("div");
            owner.className = mode + " -owner-preview";
            owner.addEventListener("click", (event, _id=owner_info.id) => {
                if(event.target.className == "follow") return;
                render.owner(_id);
            });
            let thumbnail = document.createElement("img");
            thumbnail.draggable = false;
            thumbnail.loading = "lazy";
            thumbnail.className = "thumbnail";
            thumbnail.src = owner_info?.thumbnails?.[0]?.url;
            owner.append(thumbnail);
            let name = document.createElement("span");
            name.className = "name";
            name.innerText = owner_info?.name ?? "";
            name.setAttribute("verified", owner_info?.verified ?? false);
            owner.append(name);
            let followers = document.createElement("span");
            followers.className = "followers";
            followers.innerText = `${(owner_info?.followers ?? 0)} ${i18n.text("followers")}`;
            owner.append(followers);
            let follow = document.createElement("material-symbol");
            follow.className = "follow";
            follow.innerText = ["notifications", "notifications_active"][Number(database.following.is_following(owner_info.id))];
            follow.addEventListener("click", async () => {
                if(!database.following.is_following(owner_info.id)){ // If not following yet
                    follow.innerText = "notifications_active";
                    database.following.add({
                        id: owner_info.id,
                        name: owner_info.name,
                        followers: owner_info.followers,
                        verified: owner_info.verified,
                        thumbnail: await image_helper.data_uri.from_image_uri(owner_info?.thumbnails?.[0]?.url),
                    });
                } else {
                    follow.innerText = "notifications";
                    database.following.remove(owner_info.id);
                };
            });
            owner.append(follow);
            return owner;
        },
        chips: (parent, keywords, event_handler) => {
            parent.innerHTML = "";
            keywords.forEach(keyword => {
                let chip = document.createElement("div");
                chip.innerText = keyword;
                chip.addEventListener("click", (_, _event_handler=event_handler) => {
                    _event_handler(keyword);
                });
                parent.append(chip);
            });
        },
        video_player_details: (parent, list, title) => {
            parent.innerHTML = "";
            if(title != null){
                let title_element = document.createElement("div");
                title_element.className = "title";
                title_element.innerText = title;
                parent.append(title_element);
            }
            list.forEach((text, index) => {
                let list_item = document.createElement("div");
                list_item.className = "list-item";
                if(typeof(text) == "string") {
                    list_item.setAttribute("value", index);
                    list_item.innerText = text;
                } else {
                    list_item.setAttribute("value", text.value);
                    list_item.innerText = text.text;
                }
                parent.append(list_item);
            });
        },
        info_with_kaomoji: (_info, _kaomoji) => {
            let container = document.createElement("div");
            container.className = "info_with_kaomoji";
            let kaomoji = document.createElement("span");
            kaomoji.className = "kaomoji";
            kaomoji.innerText = i18n.text(_kaomoji);
            container.append(kaomoji);
            container.append(document.createElement("br"));
            container.append(i18n.text(_info));
            return container;
        },
        queue: (element) => {
            element.innerHTML = "";
            let active_track = components.tabs.watch.video.$_queue_active();
            components.tabs.watch.video.$queue.forEach((video_preview, index) => {
                let preview = render.$.video_preview("list", {...video_preview, keep_queue:true});
                if(active_track == index){
                    preview.className += " active";
                };
                element.append(preview);
            });
        },
        thumbar_buttons: (is_playing) => {
            components.$.$_window.setThumbarButtons([
                {
                    tooltip: "Previous",
                    icon: electron.nativeImage.createFromPath(path.join(__dirname, "assets/material-symbols/skip_previous.png")),
                    click: () => {
                        components.tabs.watch.video.$_previous();
                    }
                }, {
                    tooltip: (is_playing) ? "Pause" : "Play",
                    icon: electron.nativeImage.createFromPath(path.join(__dirname, "assets/material-symbols/" + ((is_playing) ? "pause" : "play_arrow") + ".png")),
                    click: () => {
                        components.tabs.watch.video.$_play_pause();
                    }
                }, {
                    tooltip: "Next",
                    icon: electron.nativeImage.createFromPath(path.join(__dirname, "assets/material-symbols/skip_next.png")),
                    click: () => {
                        components.tabs.watch.video.$_next();
                    }
                }
            ]);
        },
        comment_preview: (info) => {
            let __channel_opener = (event, channel_id=info.owner.id) => {
                render.owner(channel_id);
            };
            let outer = document.createElement("div");
            outer.className = "-comment-preview";
            let thumbnail = document.createElement("img");
            thumbnail.draggable = false;
            thumbnail.src = info.owner.thumbnail;
            thumbnail.addEventListener("click", __channel_opener);
            outer.append(thumbnail);
            let details = document.createElement("div");
            outer.append(details);
            let name = document.createElement("div");
            name.className = "name";
            name.innerText = info.owner.name;
            name.setAttribute("verified", info.owner.is_verified);
            name.addEventListener("click", __channel_opener);
            details.append(name);
            let text = document.createElement("div");
            text.className = "text";
            text.innerText = info.text;
            details.append(text);
            return outer;
        }
    },
    trends: async () => {
        components.tabs.trends.$.innerHTML = ""; 
        // Mix of history and feed
        // It's better than crawling a random playlist that probably unrelated instead
        // Maybe I should pick some videos and request related videos about it to make feed more relevant and make new things discover
        let videos = [...database.feed.content.feed, ...database.history.content].toSorted((a,b)=>(Math.random()>0.5)?1:-1);
        if(videos.length == 0) return components.tabs.trends.$.append(render.$.info_with_kaomoji("there_are_nothing_more_dog", "kaomoji_dog"));
        let video_ids = videos.map(a=>a.id);
        videos = videos.filter((a,i)=>video_ids.indexOf(a.id)==i); // filter same videos that exist in both source
        videos = videos.slice(0, 100);

        videos.forEach(video_preview => {
            components.tabs.trends.$.append(render.$.video_preview("compact", video_preview));
        });
    },
    watch: async (id) => {
        components.tabs.watch.$.scrollBy(0, -99999);
        let previous_title = components.tabs.watch.info.title.innerText;
        components.tabs.watch.info.title.innerText = i18n.text("loading");

        let response = await yt_dlp(["--skip-download", "--write-comments", "--extractor-args", "youtube:max-comments=50", "--dump-json", `https://www.youtube.com/watch?v=${id}`], 3*60*60*1000); // 3 hour cache
        response.id = id;
        components.tabs.watch.$$response = response;

        if(components.tabs.watch.video.$hls != null){
            components.tabs.watch.video.$hls.destroy();
            components.tabs.watch.video.$hls = null;
        };

        components.tabs.watch.video.$_unload();
        
        let video_tracks = response.formats.filter(a=>a.url && a.format_note?.includes("p") && a.vbr /* to eliminate video+audio stream*/);
        let audio_tracks = response.formats.filter(a=>a.resolution.includes("audio"));
        let hls_tracks = response.formats.filter(a=>a.manifest_url);

        components.tabs.watch.video.$video_tracks = [];
        components.tabs.watch.video.$audio_tracks = [];
        components.tabs.watch.video.$related_tracks = response.formats.filter(a=>a.url && a.format_note?.includes("p") && !a.vbr);
        if(!response.is_live || video_tracks.length == 0){
        //if(false){
            if(response.was_live) {
                components.tabs.watch.video.video_player.stream_date.$.setAttribute("show", true);
                components.tabs.watch.video.video_player.stream_date.date.innerText = components.tabs.watch.$$response.playability.streamTime.toLocaleString();
            } else {
                components.tabs.watch.video.video_player.stream_date.$.setAttribute("show", false);
                ([
                    [video_tracks, components.tabs.watch.video.$video_tracks],
                    [audio_tracks, components.tabs.watch.video.$audio_tracks]
                ]).map(target => {
                    target[0].map(stream => {
                        target[1].push(stream);
                    });
                });

                components.tabs.watch.video.$_change_stream("video", -1);
                components.tabs.watch.video.$_change_stream("audio", -1);
            };
        } else {
            if(!response.is_live) console.warn("No video tracks for us? :(");
            // Since Newflow pip is not compatible with live streams
            // Close Newflow pip until live stream ends.
            if(components.tabs.watch.video.$pip.$is_pip){
                components.tabs.watch.video.$pip.$toggle();
            }
            components.tabs.watch.video.$hls = new Hls();
            components.tabs.watch.video.$hls.loadSource(components.tabs.watch.$$response?.manifest_url ?? hls_tracks.at(-1).manifest_url);
            components.tabs.watch.video.$hls.attachMedia(components.tabs.watch.video.$video);
            components.tabs.watch.video.$hls.on(Hls.Events.MANIFEST_PARSED,function() {
                components.tabs.watch.video.$video_tracks = components.tabs.watch.video.$hls.levels.map(a=>a.height+"p");
                render.$.video_player_details(
                    components.tabs.watch.video.video_player.controls.details.$$.video_quality,
                    components.tabs.watch.video.$video_tracks,
                    i18n.text("video_quality")
                );
                video.play();
            });
        }

        components.playbar.controls.play_pause.innerText = "play_arrow";
        components.tabs.watch.video.video_player.controls.play_pause.innerText = "play_arrow";

        components.tabs.watch.info.title.innerText = response.title;
        components.playbar.title.innerText = response.title;
        components.tabs.watch.info.description.innerText = response.description;
        components.tabs.watch.video.video_player.$.setAttribute("timelines", (response.chapters ?? []).map(a=>[a.start_time, a.title]));
        components.tabs.watch.info.controls.like.setAttribute("count", response.like_count);
        render.$.chips(components.tabs.watch.info.keywords, response.tags, render.search);
        components.playbar.thumbnail.src = response.thumbnail;
        components.tabs.watch.video.video_player.thumbnail.src = response.thumbnail;
        components.tabs.watch.video.$video.poster = response.thumbnail;
        components.tabs.watch.info.owner.name.innerText = response.channel;
        components.tabs.watch.info.owner.name.setAttribute("verified", !!response.channel_is_verified);
        components.playbar.owner.innerText = response.channel;
        components.tabs.watch.info.owner.followers.innerText = `${response.channel_follower_count} ${i18n.text("followers")}`;

        components.tabs.watch.video.$_add_track({
            id: id,
            title: response.title,
            thumbnail: response.thumbnail,
            length: response.duration,
            owner: {
                name: response.channel,
                verified: !!response.channel_is_verified
            }
        }, true);

        (async () => {
            let playlist_mix_data = await yt_dlp([
                "--skip-download",
                "--flat-playlist",
                "--playlist-items", "2:21", // skip first video which is already running
                "--dump-single-json",
                `https://www.youtube.com/watch?v=${components.tabs.watch.$$response.id}&list=RD${components.tabs.watch.$$response.id}`
            ]);
            let recommended_videos = playlist_mix_data.entries || [];

            components.tabs.watch.next_videos.innerHTML = "";

            recommended_videos.forEach(video_preview => {
                components.tabs.watch.next_videos.append(render.$.video_preview("compact", {
                    id: video_preview.id,
                    title: video_preview.title,
                    thumbnail: video_preview.thumbnails[0].url,
                    owner: {
                        name: video_preview.channel,
                        verified: !!video_preview.channel_is_verified
                    },
                    length: video_preview.duration
                }));
            });

            if(components.tabs.watch.panels.autoplay.checked
                && components.tabs.watch.video.$queue[components.tabs.watch.video.$_queue_active()] == components.tabs.watch.video.$queue.at(-1)){ // if the playing track is last track
                    for(let next_index = 0; next_index < recommended_videos.length; next_index++) {
                        if(recommended_videos[next_index].duration > 15*60) { // TODO: @@@ some settings If video longer than 15min
                            continue;
                        }
                        if(components.tabs.watch.video.$_add_track({
                            id: recommended_videos[next_index].id,
                            length: recommended_videos[next_index].duration,
                            thumbnail: recommended_videos[next_index].thumbnails[0].url,
                            title: recommended_videos[next_index].title,
                            owner: {
                                name: recommended_videos[next_index].channel,
                                verified: !!recommended_videos[next_index].channel_is_verified
                            }
                        }, false)){
                            break;
                        }
                    }
            };
            // Update playing queue
            render.$.queue(components.tabs.watch.panels.playing_queue);
            render.$.queue(components.tabs.queue.$);

            // Update controls
            components.tabs.watch.video.video_player.controls.previous.style.setProperty("display", ["none","unset"][Number(components.tabs.watch.video.$_can_previous())]);
            components.tabs.watch.video.video_player.controls.next.style.setProperty("display", ["none","unset"][Number(components.tabs.watch.video.$_can_next())]);
        })();

        (async () => {
            let owner_info = await yt_dlp(["--skip-download", "--dump-single-json", "--flat-playlist", "--playlist-items", "0", "--extractor-args", "youtubetab:approximate_date", `https://www.youtube.com/channel/${components.tabs.watch.$$response.channel_id}`]);
            components.tabs.watch.info.owner.thumbnail.src = owner_info.thumbnails.filter(a=>a.id.includes("avatar"))[0].url;
        })();

        if(Array.isArray(response.chapters) && response.chapters.length > 0){
            render.$.video_player_details(
                components.tabs.watch.video.video_player.controls.details.$$.timelines,
                components.tabs.watch.$$response.chapters.map(timeline => ({
                    text: timeline.title,
                    value: timeline.start_time
                })),
                i18n.text("timelines")
            );
        };

        components.tabs.watch.video.video_player.controls.previous.style.setProperty("display", ["none","unset"][Number(components.tabs.watch.video.$_can_previous())]);
        components.tabs.watch.video.video_player.controls.next.style.setProperty("display", ["none","unset"][Number(components.tabs.watch.video.$_can_next())]);

        let get_language_name = _lang => {
            try {
                return (new Intl.DisplayNames([navigator.language], {type:"language"})).of(_lang) ?? _lang;
            } catch {
                return _lang;
            };
        };

        render.$.video_player_details(
            components.tabs.watch.video.video_player.controls.details.$$.audio_quality,
            components.tabs.watch.video.$audio_tracks.map(track => {
                let codec = track.acodec;
                if(track.acodec.includes("mp4a")){
                    codec = "m4a";
                } else if(track.acodec.includes("opus")) {
                    codec = "opus";
                };
                let language = get_language_name(track.language);
                return `${language} / ${track.abr} / ${codec}`;
            }),
            i18n.text("audio_quality")
        );

        render.$.video_player_details(
            components.tabs.watch.video.video_player.controls.details.$$.video_quality,
            components.tabs.watch.video.$video_tracks.map(track => {
                let codec = track.vcodec;
                if(track.vcodec.includes("mp4")){
                    codec = "mpeg-4";
                } else if(track.vcodec.includes("webm")) {
                    codec = "webm";
                };
                return `${track.format_note} / ${track.vbr} / ${codec}`;
            }),
            i18n.text("video_quality")
        );

        components.tabs.watch.video.$captions.$_remove();
        render.$.video_player_details(
            components.tabs.watch.video.video_player.controls.details.$$.captions,
            [
                {text:i18n.text("disable"), value:-1},
                ...Object.keys(components.tabs.watch.$$response.subtitles).filter(a=>a!="live_chat").map((track,index) => ({text:get_language_name(track), value:track}))
            ],
            i18n.text("captions")
        );

        // TODO: Auto start playing video
        components.tabs.watch.video.$video.addEventListener("canplay", () => {
            components.tabs.watch.video.$_play();
        }, {once: true});

        (async () => {
            // TODO: @@@watch.mediaSession.square_artwork<bool>(false||false|true)
            /*let the_artwork = [{
                src: response.thumbnails[0].url,
                sizes: `${response.thumbnails[0].width}x${response.thumbnails[0].height}`
            }];*/

            let thumbnail = components.tabs.watch.$$response.thumbnails.filter(a=>a.resolution)[0];

            let the_artwork = [{
                src: await image_helper.crop.as_square(thumbnail.url, 256, thumbnail.width, thumbnail.height),
                sizes: `256x256`
            }];

            navigator.mediaSession.metadata = new MediaMetadata({
                title: response.title,
                artist: response.channel,
                artwork: the_artwork
            });
        })();

        (async () => {
            // TODO: @@@ui.styles.video_theme_colors<bool>(true||false|true)
            let dominant_color = await image_helper.dominant_color(response.thumbnail);
            document.body.setAttribute("theme-variant", "player-effects");
            document.body.style.setProperty("--effect-color", dominant_color);
        })();

        // Add/Update history record
        (async () => {
            database.history.add({
                title: response.title,
                id: id,
                owner: {
                    name: response.channel,
                    verified: !!response.channel_is_verified
                },
                thumbnail: await image_helper.data_uri.from_image_uri(response.thumbnail),
                length: response.duration
            });
        })();

        (async () => {
            if(database.following.is_following(response.channel_id)){
                components.tabs.watch.info.owner.follow.innerText = "notifications_active";
            } else {
                components.tabs.watch.info.owner.follow.innerText = "notifications";
            }
        })();

        // Update playing queue
        render.$.queue(components.tabs.watch.panels.playing_queue);
        render.$.queue(components.tabs.queue.$);

        components.tabs.watch.comments.innerHTML = "";
        response.comments.forEach(data=>components.tabs.watch.comments.append(render.$.comment_preview({
            owner: {
                thumbnail: data.author_thumbnail,
                id: data.author_id,
                name: data.author,
                is_verified: data.author_is_verified
            },
            text: data.text
        })));
    },
    owner: async (id) => {
        let data = await yt_dlp(["--skip-download", "--dump-single-json", "--flat-playlist", "--extractor-args", "youtubetab:approximate_date", `https://www.youtube.com/channel/${id}`]);
        components.tabs.owner.$$response = data;
        components.tabs.$_switch("owner");
        
        //let avatars = components.tabs.owner.$$response.thumbnails.filter(a=>!!a.width && a.width === a.height);
        let avatars = components.tabs.owner.$$response.thumbnails.filter(a=>a.id.includes("avatar"));
        let banners = components.tabs.owner.$$response.thumbnails.filter(a=>a.id.includes("banner"));

        let videos = null
        if(!!components.tabs.owner.$$response.entries[0].entries) {
            videos = components.tabs.owner.$$response.entries.map(a=>a.entries).reduce((a,b)=>{return [...a,...b]},[]);
        } else {
            videos = components.tabs.owner.$$response.entries;
        };

        if(banners.length != 0){
            components.tabs.owner.banner.background.setAttribute("banner", true);
            components.tabs.owner.banner.background.src = banners[0].url;
        } else {
            components.tabs.owner.banner.background.setAttribute("banner", false);
        };
        components.tabs.owner.banner.description.innerText = data.description;
        components.tabs.owner.banner.followers.innerText = data.channel_follower_count + " Followers";
        components.tabs.owner.banner.name.innerText = data.channel;
        components.tabs.owner.banner.video_count.innerText = videos.length + " Videos";
        components.tabs.owner.banner.thumbnail.src = avatars[0].url;
        //components.tabs.owner.banner.name.setAttribute("verified", data.channel_is_verified);

        components.tabs.owner.videos.innerHTML = "";

        if(videos.length > 0) {
            videos.forEach(video_preview => {
                components.tabs.owner.videos.append(render.$.video_preview("compact", {
                    id: video_preview.id,
                    title: video_preview.title,
                    thumbnail: video_preview.thumbnails?.[0]?.url ?? null,
                    length: video_preview.duration,
                    owner: {
                        name: data.name
                    }
                }));
            });
        };

        (async () => {
            if(database.following.is_following(data.id)){
                components.tabs.owner.banner.follow.innerText = "notifications_active";
            } else {
                components.tabs.owner.banner.follow.innerText = "notifications";
            }
        })();
    },
    search: async (query) => {
        components.tabs.$_switch("search");
        components.titlebar.search.value = query;
        components.tabs.search.$.innerHTML = "";
        let response = await yt_dlp(["--skip-download", "--dump-single-json", "--flat-playlist", "--playlist-items", "1:20", `ytsearch20:${query}`]);
        response.entries.forEach(video_preview => {
            components.tabs.search.$.append(render.$.video_preview("normal", {
                id: video_preview.id,
                title: video_preview.title,
                thumbnail: video_preview.thumbnails[0].url,
                owner: {
                    name: video_preview.channel,
                    id: video_preview.channel_id,
                    verified: video_preview.channel_is_verified
                },
                length: video_preview.duration
            }));
        });
    },
    history: async () => {
        components.tabs.history.$.innerHTML = "";
        if(database.history.content.length == 0) return components.tabs.history.$.append(render.$.info_with_kaomoji("there_are_nothing_more_dog", "kaomoji_dog"));
        database.history.content.toReversed().forEach(video_preview => {
            components.tabs.history.$.append(render.$.video_preview("normal", video_preview));
        });
    },
    following: async () => {
        components.tabs.following.$.innerHTML = "";
        if(database.following.content.length == 0) return components.tabs.following.$.append(render.$.info_with_kaomoji("there_are_nothing_more_dog", "kaomoji_dog"));
        database.following.content.forEach(owner => {
            owner.thumbnails = [{url: owner.thumbnail}];
            components.tabs.following.$.append(render.$.owner_preview("compact", owner));
        });
    },
    feed: async () => {
        components.tabs.feed.$.innerHTML = "";
        if((database.feed.content?.feed?.length ?? 0) == 0) return components.tabs.feed.$.append(render.$.info_with_kaomoji("there_are_nothing_more_dog", "kaomoji_dog"));
        database.feed.content.feed.forEach(video_preview => {
            components.tabs.feed.$.append(render.$.video_preview("normal", {
                id: video_preview.id,
                title: video_preview.title,
                thumbnail: video_preview.thumbnail,
                owner: {
                    name: video_preview.owner.name,
                    verified: video_preview.owner.verified
                },
                length: video_preview.length
            }));
        });
    },
    downloads: async () => {
        components.tabs.downloads.$.innerHTML = "";
        if(components.tabs.downloads.$list.length == 0) return components.tabs.downloads.$.append(render.$.info_with_kaomoji("there_are_nothing_more_dog", "kaomoji_dog"));
        components.tabs.downloads.$list.forEach((media, index) => {
            let renderer = render.$.video_preview("normal", {
                title: media.properties.title,
                owner: {
                    name: media.properties.owner.name
                },
                length: media.properties.length,
                id: media.properties.id,
                thumbnail: media.properties.thumbnail
            });
            renderer.style.setProperty("--progress", (media.contentSize/media.contentLength*100)+"%");
            renderer.setAttribute("state", media.state);
            components.tabs.downloads.$.append(renderer);
        });
    },
    playlists: async () => {
        components.tabs.playlists.$.innerText = "";
        Object.keys(database.playlists.content).forEach(playlist => {
            let playlist_data = database.playlists.content[playlist];
            components.tabs.playlists.$.append(render.$.playlist_preview("normal", {
                id: playlist,
                title: playlist_data.title,
                thumbnail: playlist_data.thumbnail
            }));
        });
    }
};
