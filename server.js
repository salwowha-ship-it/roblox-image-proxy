const express = require("express");
const Jimp = require("jimp");
const app = express();

app.get("/pixels", async (req, res) => {
    const url = req.query.url;
    const size = parseInt(req.query.size) || 32;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    try {
        const image = await Jimp.read(url);
        image.resize(size, size);
        let pixels = [];
        image.scan(0, 0, size, size, function(x, y, idx) {
            pixels.push({
                x, y,
                r: this.bitmap.data[idx],
                g: this.bitmap.data[idx + 1],
                b: this.bitmap.data[idx + 2]
            });
        });
        res.json({ pixels });
    } catch (e) {
        res.status(500).json({ error: "Failed to load image: " + e.message });
    }
});

app.listen(3000, () => console.log("Proxy running on port 3000"));
