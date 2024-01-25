var image_helper = {
    crop: {
        as_square: (src, size, orig_width, orig_height) => {
            return new Promise(resolve => {
                let image = document.createElement("img");
                image.addEventListener("load", () => {
                    let canvas = document.createElement("canvas");
                    canvas.width = size;
                    canvas.height = size;
                    let ctx = canvas.getContext("2d");

                    square_size = Math.min(orig_width,orig_height);
                    multiplier = 256/square_size;
                    max_size = Math.max(orig_width,orig_height);
                    crop_size = (max_size-square_size)/2;
                    is_from_left = square_size == orig_height;
                    if(is_from_left) {
                        ctx.drawImage(image, -crop_size*multiplier, 0, max_size*multiplier, 256);
                    } else {
                        ctx.drawImage(image, 0, -crop_size*multiplier, 256, max_size*multiplier);
                    }
                    resolve(canvas.toDataURL());
                });
                image.src = src;
            });
        }
    },
    data_uri: {
        from_image_uri: async (uri, type="jpg") => {
            let image_content = await fetch(uri);
            let image_content_as_array_buffer = await image_content.arrayBuffer();
            return "data:image/"+ type + ";base64," + Buffer.from(image_content_as_array_buffer).toString("base64")
        }
    },
    dominant_color: (uri) => {
        // Vibrant Library
        if(Vibrant != null) {
            return new Promise(async (res) => {
                try {
                    let vib = new Vibrant(uri);
                    let palette = await vib.getPalette();
                    res((palette.Vibrant ??
                            palette.Muted ??
                            palette.DarkVibrant ??
                            palette.LightVibrant ??
                            palette.DarkMuted ??
                            palette.LightMuted)?.getHex() ?? "#777777");
                } catch {
                    res("#777777");
                }
            });
        };
        // Browser implementation
        return new Promise((res) => {
            let the_image = document.createElement("img");
            the_image.addEventListener("load", () => {
                let canvas = document.createElement("canvas");
                canvas.width = 1;
                canvas.height = 1;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(the_image, 0,0,1,1);
                let dominant_pixel = ctx.getImageData(0,0,1,1);
                let dominant_color = "#"+Array.from(dominant_pixel.data).map(data=>data.toString(16).padStart(2, "0")).join("");
                res(dominant_color.slice(0,7)); // remove alpha from color
            });
            the_image.src = uri;
        });
    }
};
