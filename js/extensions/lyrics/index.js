var lyrics = {
    components: {
        $: null,
        title: null,
        lyrics: null,
        get: null,
        info: null
    },
    parser: new DOMParser(),
    get_lyrics: async (title) => {
        try {
            title = title.replace(/[\[\(\{].*[\]\)\}]/g,"").replace(/\|.*/g,"").trim();
            let search_page = await fetch("https://genius.com/api/search/multi?per_page=5&q=" + encodeURIComponent(title));
            let search_data = await search_page.json()
            let lyric_page = await fetch(search_data?.response?.sections?.[0]?.hits?.[0]?.result?.relationships_index_url)
            let lyric_page_data = await lyric_page.text()
            let lyric_page_document = lyrics.parser.parseFromString(lyric_page_data, "text/html");
            return lyric_page_document.querySelector(`[data-lyrics-container="true"]`).innerHTML.replace(/\<[\\]*br\>/g,"\n").replace(/<[\\]*[^\>]+\>/g,"");
        } catch {
            return "Unable to extract lyrics";
        }
    },
    __load__: () => {
        lyrics.components.$ = document.createElement("div");
        lyrics.components.$.style = "display: flex; flex-direction: column; gap: 5px;";
        components.tabs.watch.panels.$.append(lyrics.components.$);
        lyrics.components.title = document.createElement("h1");
        lyrics.components.title.innerText = "Lyrics";
        lyrics.components.$.append(lyrics.components.title);
        lyrics.components.get = document.createElement("button");
        lyrics.components.get.innerText = "Get Lyrics";
        lyrics.components.get.addEventListener("click", async () => {
            let the_lyrics = await lyrics.get_lyrics(components.tabs.watch.$$response.title);
            lyrics.components.lyrics.innerText = the_lyrics;
        });
        lyrics.components.get.style = "width: 100%; padding: 5px; background: var(--seconder-background-color); border: none; border-radius: var(--border-radius-size);";
        lyrics.components.$.append(lyrics.components.get);
        lyrics.components.lyrics = document.createElement("div");
        lyrics.components.lyrics.style = "user-select:text;";
        lyrics.components.$.append(lyrics.components.lyrics);
        lyrics.components.info = document.createElement("div");
        lyrics.components.info.innerText = "Lyric data is taken from Genius.\nThis plugin is not supported by Genius.";
        lyrics.components.$.append(lyrics.components.info);
    },
    __unload__: () => {
        lyrics.components.$.remove();
        lyrics = undefined;
    }
};
