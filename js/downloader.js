var downloader = {
    download: (uri, href, $prev_on) => {
        let $on = $prev_on;
        if($prev_on == null){
            $on = document.createElement("div");
        };
        $on.contentSize = 0;
        $on.uri = uri;
        $on.href = href;
        $on.state = "downloading";

        let file = fs_legacy.createWriteStream(href);
        http_ = (new URL(uri).protocol == "http:") ? http : https;
        let options = {
            headers: {
                'User-Agent': navigator.userAgent.replace(/NewFlow\/[0-9\.]*\ /g, "").replace(/Electron\/[0-9\.]*\ /g, "")
            }
        };
        let request = http_.get(uri, options, response => {
            if(response.statusCode >= 300 && response.statusCode < 400 && response.headers.location){
                console.info("Server redirected to: " + response.headers.location);
                return downloader.download(response.headers.location, href, $on);
            };

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