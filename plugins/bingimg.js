const axios = require('axios');
const fetch = require('node-fetch');

async function bingImgCommand(sock, chatId, message) {
    try {
        const prompt = message.message?.conversation?.trim() || 
                      message.message?.extendedTextMessage?.text?.trim() || '';
        
        const searchQuery = prompt.slice(8).trim();
        
        if (!searchQuery) {
            await sock.sendMessage(chatId, {
                text: '❌ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘁𝗲𝗿 𝘁𝗵𝗲 𝗻𝗮𝗺𝗲 𝗼𝗳 𝗶𝗺𝗮𝗴𝗲 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁.\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: .bingimg beautiful sunset'
            }, {
                quoted: message
            });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '🔎 𝗦𝗲𝗮𝗿𝗰𝗵𝗶𝗻𝗴 𝘁𝗵𝗲 𝗶𝗺𝗮𝗴𝗲 𝗽𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁...'
        }, {
            quoted: message
        });

        const apiUrl = `https://delirius-apiofc.vercel.app/search/bingimage?query=${encodeURIComponent(searchQuery)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.results || response.data.results.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ 𝗜𝗺𝗮𝗴𝗲 𝗻𝗼𝘁 𝗳𝗼𝘂𝗻𝗱 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗻𝗼𝘁𝗵𝗲𝗿 𝗶𝗺𝗮𝗴𝗲.'
            }, {
                quoted: message
            });
            return;
        }

        const imageUrls = response.data.results.slice(0, 5).map(img => img.direct).filter(url => url);
        let successCount = 0;

        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const imageUrl = imageUrls[i];
                
                const imageResponse = await fetch(imageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 10000
                });

                if (!imageResponse.ok) {
                    console.log(`Failed to download Bing image ${i + 1}`);
                    continue;
                }

                const imageBuffer = await imageResponse.buffer();

                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `🔎 𝗕𝗶𝗻𝗴 𝗜𝗺𝗮𝗴𝗲 ${i + 1}/${imageUrls.length}: "${searchQuery}"`
                }, {
                    quoted: message
                });

                successCount++;
                
                if (i < imageUrls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (imgError) {
                console.error(`Error downloading Bing image ${i + 1}:`, imgError.message);
                continue;
            }
        }

        if (successCount === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ 𝗘𝗿𝗿𝗼𝗿 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻.'
            }, {
                quoted: message
            });
        }

    } catch (error) {
        console.error('Error in bingimg command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ 𝗘𝗿𝗿𝗼𝗿 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 1 𝗺𝗼𝗿𝗲 𝘁𝗶𝗺𝗲.'
        }, {
            quoted: message
        });
    }
}

module.exports = bingImgCommand;
