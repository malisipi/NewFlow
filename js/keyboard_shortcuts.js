document.body.addEventListener("keydown", event => {
    if(document.activeElement.tagName.toLowerCase() === "input") return;
    switch(components.tabs.$active()){
        case "watch": {
            switch(event.code){
                case "KeyK":
                case "Space": {
                    components.tabs.watch.video.$_play_pause();
                    break;
                };
                case "KeyJ":
                case "ArrowLeft": {
                    components.tabs.watch.video.$_seekby(-10);
                    break;
                };
                case "KeyL":
                case "ArrowRight": {
                    components.tabs.watch.video.$_seekby(10);
                    break;
                };
                case "KeyP": {
                    components.tabs.watch.video.$_previous();
                    break;
                };
                case "KeyN": {
                    components.tabs.watch.video.$_next();
                    break;
                };
                case "KeyT": {
                    components.tabs.watch.video.$_theatre();
                    break;
                };
                case "KeyF": {
                    components.tabs.watch.video.$_fullscreen();
                    break;
                };
                case "ArrowUp": {
                    components.tabs.watch.video.$_volume(Math.min(components.tabs.watch.video.$volume()+0.05,1));
                    break;
                };
                case "ArrowDown": {
                    components.tabs.watch.video.$_volume(Math.max(components.tabs.watch.video.$volume()-0.05,0));
                    break;
                };
                default: {
                    return;
                }
            }
            break;
        }
        default: {
            return;
        }
    };
    event.preventDefault();
});