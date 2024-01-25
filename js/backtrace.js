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
        alert(`${event.target.error.code} / ${event.target.error.message}`);
        console.error(event.target.error);
    });
});
