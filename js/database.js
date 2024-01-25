var database = {
    following: new JsonDatabase("./dbs/following.json", {defaultStructure: []}),
    feed: new JsonDatabase("./dbs/feed.json"),
    playlists: new JsonDatabase("./dbs/playlists.json", {
        defaultStructure: {
            $liked_videos: {
                title: "Liked Videos",
                thumbnail: "./assets/playlist_liked.png",
                list: []
            },
            $watch_later: {
                title: "Watch Later",
                thumbnail: "./assets/playlist_watch_later.png",
                list: []
            }
        },
        fill_missing: true
    }),
    history: new JsonDatabase("./dbs/history.json", {defaultStructure: []}),
    settings: new JsonDatabase("./dbs/settings.json", {defaultStructureFrom: "./dbs/settings.template.json", fill_missing: true})
};

database.following.init();
database.following.add = (owner) => {
    /*
     * owner.id<String>
     * owner.thumbnail<String> (data-uri)
     * owner.name<String>
     * owner.followers<Number>
     * owner.verified<Boolean>
     * owner.follow_time<String> (ISODate)
     */
    if(owner.id == null) return false;
    database.following.content.push({
        id: owner.id,
        thumbnail: owner.thumbnail ?? null,
        name: owner.name ?? "Unknown Channel",
        followers: owner.followers ?? 0,
        verified: owner.verified ?? false,
        follow_time: (new Date).toISOString()
    });
    database.following.update_file();
};
database.following.is_following = (owner_id) => {
    return database.following.content.filter(owner => owner.id == owner_id).length >= 1;
};
database.following.remove = (owner_id) => {
    database.following.content = database.following.content.filter(owner => owner.id != owner_id);
    database.following.update_file();
};
database.feed.init();
database.feed.fetch = async () => {
    database.feed.content.fetch_time = (new Date).toISOString();
    database.feed.content.feed = [];
    let owners = database.following.content.map(owner => owner.id);
    for(let owner_index=0; owner_index < owners.length; owner_index++){
        let id = owners[owner_index];
        database.feed.content.feed = [...database.feed.content.feed, ...(await yt_extractor.owner.get_owner_videos(id)).entry];
    };
    database.feed.content.feed.sort((a, b) => {
        if(new Date(a.published) < new Date(b.published)){
            return 1;
        } else {
            return -1;
        }
    });
    database.feed.update_file();
};
database.playlists.init();
database.history.init().then(() => {
    if (database.history.content.length > 2500) {
        console.warn("Huge watch history, Maybe you should clear or reduce the history?");
    }
});
database.history.add = (video) => {
    /*
     * video.id<String>
     * video.owner_name<String>
     * video.thumbnail<String> (data-uri)
     * video.length<Number>
     * video.title<String>
     * video.view_count<Number> (Counts of this user view count)
     * video.last_watch_time<String> (ISODate)
     */
    if(video.id == null) return false;
    let previous_record = database.history.content.filter($video => $video.id == video.id)?.[0];
    let view_count = (previous_record?.view_count ?? 0) + 1;
    database.history.content = database.history.content.filter($video => $video.id != video.id);
    database.history.content.push({
        id: video.id,
        owner_name: video.owner_name ?? "Unknown Owner",
        length: video.length ?? 0,
        thumbnail: video.thumbnail ?? null,
        title: video.title ?? "Unknown Title",
        view_count: view_count ?? 1,
        last_watch_time: (new Date).toISOString()
    });
    database.history.update_file();
};
database.history.reduce = () => {
    let total_watch_count = database.history.content.reduce((total, video) => total + video.view_count, 0);
    let average_watch_count = total_watch_count / database.history.content.length;
    database.history.content = database.history.content.filter(video => video.view_count > average_watch_count);
    database.history.update_file();
};
database.settings.init();
