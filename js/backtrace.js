window.onerror = (message, source, lineno, colno, err) => {
    alert(`@${lineno}/${colno}: ${message}
Source: ${source},
Full Error: ${err}`);
    console.warn(`@${lineno}/${colno}: ${message}
Source: ${source},
Full Error: ${err}`);
    return true;
};

window.addEventListener("DOMContentLoaded", () => {
    components.tabs.watch.video.$video.addEventListener("error", async event => {
        if(event.target.error.code == 4) {
            ytdlp_cache_invalidate(components.tabs.watch.$$response.id);
            console.warn("Cache invalidated, " + components.tabs.watch.$$response.id);
            render.watch(components.tabs.watch.$$response.id);
        } else {
            alert(`${event.target.error.code} / ${event.target.error.message}`);
            console.error(event.target.error);
        };
    });
});
