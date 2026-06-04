const axios = require('axios');
const fetch = require('node-fetch');

async function imgCommand(sock, chatId, message) {
    try {
        // Get the search query from the message
        const prompt = message.message?.conversation?.trim() || 
                      message.message?.extendedTextMessage?.text?.trim() || '';
        
        // Remove the command prefix and trim
        const searchQuery = prompt.slice(4).trim();
        
        if (!searchQuery) {
            await sock.sendMessage(chatId, {
                text: '❌ Please enter the name of the image you want.\nExample: .img beautiful sunset'
            }, {
                quoted: message
            });
            return;
        }

        // Send processing message
        await sock.sendMessage(chatId, {
            text: '🔍 Searching Please wait 🙏🏻.....'
        }, {
            quoted: message
        });

        // Make API request to Google Image Search
        const apiUrl = `https://delirius-apiofc.vercel.app/search/gimage?query=${encodeURIComponent(searchQuery)}`;
        const response = await axios.get(apiUrl);

        // Check if we got valid results
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ Image not found. Please try again....'
            }, {
                quoted: message
            });
            return;
        }

        // Get multiple images (up to 5) and extract URLs
        const imageUrls = response.data.data.slice(0, 5).map(img => img.url);
        let successCount = 0;

        // Download and send each image
        for (let i = 0; i < imageUrls.length; i++) {
            try {
                const imageUrl = imageUrls[i];
                
                // Download the image using fetch with proper headers
                const imageResponse = await fetch(imageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 10000
                });

                if (!imageResponse.ok) {
                    console.log(`Failed to download image ${i + 1}`);
                    continue;
                }

                const imageBuffer = await imageResponse.buffer();

                // Send the image
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `🖼️ Image ${i + 1}/${imageUrls.length}: "${searchQuery}"`
                }, {
                    quoted: message
                });

                successCount++;
                
                // Small delay between sends to avoid spam detection
                if (i < imageUrls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (imgError) {
                console.error(`Error downloading image ${i + 1}:`, imgError.message);
                continue;
            }
        }

        // If no images were sent successfully, send error
        if (successCount === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ Error Please try again..'
            }, {
                quoted: message
            });
        }

    } catch (error) {
        console.error('Error in img command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error Please try again.'
        }, {
            quoted: message
        });
    }
}

module.exports = imgCommand;
