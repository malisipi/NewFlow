var downloader = {
    download: (uri, href) => {
        let $on = document.createElement("div");
        $on.contentSize = 0;
        $on.uri = uri;
        $on.href = href;
        $on.state = "downloading";
        let file = fs_legacy.createWriteStream(href);
        http_ = (new URL(uri).protocol == "http:") ? http : https;
        let request = http_.get(uri, response => {
            response.pipe(file);
            response.on("data", (e) => {
                $on.contentLength = Number(response.rawHeaders?.[(response.rawHeaders?.indexOf("Content-Length") ?? -1) + 1] ?? -1);
                $on.contentSize += e.length;
                $on.dispatchEvent(new CustomEvent("state-update"));
            });

            file.on("finish", () => {
                file.close();
                $on.state = "finish";
                $on.dispatchEvent(new CustomEvent("downloaded"));
            });
        });
        return $on;
    }
};