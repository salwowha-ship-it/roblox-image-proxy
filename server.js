const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so Roblox game servers can talk to it freely
app.use(cors());

app.get('/pixels', async (req, res) => {
    const { url, size } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing "url" parameter.' });
    }

    // Default to 64px if resolution size isn't specified
    const targetSize = parseInt(size) || 64;

    try {
        // 1. Download the image data with a spoofed User-Agent header to bypass blocks
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });
        const imageBuffer = Buffer.from(response.data);

        // 2. Resize image using Sharp and get raw pixel buffer matrix
        const { data, info } = await sharp(imageBuffer)
            .resize(targetSize, targetSize, {
                fit: 'fill' // Force exact grid resolution matching
            })
            .raw() // Convert format into uncompressed RGB/RGBA values
            .toBuffer({ resolveWithObject: true });

        const pixels = [];
        const channels = info.channels; // 3 for RGB, 4 for RGBA

        // 3. Map raw buffer tracking into indexed standard format coordinates
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * channels;
                
                pixels.push({
                    x: x,
                    y: y,
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2]
                });
            }
        }

        // 4. Send structured dataset back to Roblox client array loop
        res.json({ pixels });

    } catch (error) {
        console.error('Proxy Engine Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to load image: ' + error.message, 
            details: error.message 
        });
    }
});

// Root welcome check route
app.get('/', (req, res) => {
    res.send('Roblox Image Drawing Proxy is Online and Active with Browser Bypass!');
});

app.listen(PORT, () => {
    console.log(`Proxy service running smoothly on port ${PORT}`);
});
