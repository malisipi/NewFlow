var i18n = {
    language_package: {},
    get: async () => {
        let languages = await fetch("./languages.json");
        languages = await languages.json();
        let active_language = navigator.language;
        i18n.language_package = Object.keys(languages).map(
                key => ({
                    key:key, value:languages[key][active_language] ?? languages[key]["en"] ?? key
                })
            ).reduce((pack, word) => {
                pack[word.key] = word.value;
                return pack;
            }, {});
    },
    text: (key) => {
        return i18n.language_package[key] ?? key;
    },
    ready: null
};

i18n.ready = window.i18n.get();

window.addEventListener("DOMContentLoaded", async () => {
    await i18n.ready;
    document.querySelectorAll("language-pack").forEach(text => text.replaceWith(i18n.text(text.getAttribute("key"))));
})