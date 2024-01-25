var plugins = {
    list: () => {},
    load: (plugin_id) => {
        console.info(`Plugin: ${plugin_id} is loaded`);
        let plugin_script = document.createElement("script");
        document.head.append(plugin_script);
        plugin_script.setAttribute("plugin", plugin_id);
        plugin_script.addEventListener("load", (event) => {
            window[plugin_id].__load__();
        });
        plugin_script.src = `./js/extensions/${plugin_id}/index.js`;
    },
    unload: (plugin_id) => {
        console.info(`Plugin: ${plugin_id} is unloaded`);
        Array.from(document.head.querySelectorAll("script[plugin]")).filter(a=>a.getAttribute("plugin") == plugin_id)?.[0]?.remove();
        window[plugin_id].__unload__();
    }
};