const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const webp = require('node-webpmux');

async function bratCommand(sock, chatId, message, text) {
    if (!text || text.trim() === '') {
        await sock.sendMessage(chatId, {
            text: `╭──❍「 *BRAT STICKER* 」❍
│ 
│ *Usage:* .brat <text>
│ 
│ *Examples:*
│ ➤ .brat ROMEO
│ ➤ .brat ZORO-MD
│ ➤ .brat Hello World
│
│ Creates a brat-style sticker with your text!
│
╰─────────❍`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, {
            text: '⏳ Creating brat sticker...'
        }, { quoted: message });

        const encodedText = encodeURIComponent(text.trim());
        const apiUrl = `https://zellapi.autos/tools/brat?q=${encodedText}`;

        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data) {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to create brat sticker. API returned no data.'
            }, { quoted: message });
            return;
        }

        const imageBuffer = Buffer.from(response.data);

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tempInput = path.join(tmpDir, `brat_input_${Date.now()}.png`);
        const tempOutput = path.join(tmpDir, `brat_output_${Date.now()}.webp`);

        fs.writeFileSync(tempInput, imageBuffer);

        const ffmpegCommand = `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        let stickerBuffer = fs.readFileSync(tempOutput);

        const img = new webp.Image();
        const json = {
            "sticker-pack-id": "ZORO.md",
            "sticker-pack-name": "ZORO MD",
            "sticker-pack-publisher": "ROMEO",
            "emojis": ["✨"]
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);
        
        await img.load(tempOutput);
        img.exif = exif;
        
        const finalOutput = path.join(tmpDir, `brat_final_${Date.now()}.webp`);
        await img.save(finalOutput);
        
        stickerBuffer = fs.readFileSync(finalOutput);

        await sock.sendMessage(chatId, {
            sticker: stickerBuffer
        }, { quoted: message });

        try {
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
            fs.unlinkSync(finalOutput);
        } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
        }

    } catch (error) {
        console.error('Error in brat command:', error);
        
        let errorMessage = '❌ *Error creating brat sticker!*\n\n';
        
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage += 'Connection timeout. Please try again.';
        } else if (error.response) {
            errorMessage += `API Error: ${error.response.status}\nPlease try again later.`;
        } else if (error.request) {
            errorMessage += 'No response from API. Check your connection.';
        } else {
            errorMessage += 'Something went wrong. Please try again.';
        }

        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = bratCommand;
