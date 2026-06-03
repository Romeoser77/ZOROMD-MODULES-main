const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');

function getEastAfricaTime() {
    const now = new Date();
    const eatOffset = 3 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const eatTime = new Date(utc + (eatOffset * 60000));
    
    let hours = eatTime.getHours();
    const minutes = eatTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${hours}:${minutes} ${ampm}`;
}

function getEastAfricaDate() {
    const now = new Date();
    const eatOffset = 3 * 60;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const eatTime = new Date(utc + (eatOffset * 60000));
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = eatTime.getDate();
    const month = monthNames[eatTime.getMonth()];
    const year = eatTime.getFullYear();
    
    return `${month} ${day}, ${year}`;
}

async function welcomeCommand(sock, chatId, message, match) {
    // Check if it's a group
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' });
        return;
    }

    // Check if sender is admin
    const isAdmin = require('../lib/isAdmin');
    const senderId = message.key.participant || message.key.remoteJid;
    const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
    
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { 
            text: '❌ Only group admins can manage welcome messages.' 
        });
        return;
    }

    // Extract match from message
    const text = message.message?.conversation || 
                message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');

    await handleWelcome(sock, chatId, message, matchText);
}

async function handleJoinEvent(sock, id, participants) {
    // Check if welcome is enabled for this group
    const isWelcomeEnabled = await isWelcomeOn(id);
    if (!isWelcomeEnabled) return;

    // Get custom welcome message
    const customMessage = await getWelcome(id);

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';
    const currentTime = getEastAfricaTime();
    const currentDate = getEastAfricaDate();

    // Send welcome message for each new participant
    for (const participant of participants) {
        try {
            // Handle case where participant might be an object or not a string
            const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
            
            console.log('📞 Processing participant:', participantString);
            
            // Get user's display name and actual phone number
            let displayName = null;
            let phoneNumber = null;
            
            try {
                // Get the actual WhatsApp JID from phoneNumber field first
                const freshGroupMetadata = await sock.groupMetadata(id);
                const userParticipant = freshGroupMetadata.participants.find(p => p.id === participantString);
                
                console.log('👤 User participant data:', JSON.stringify(userParticipant, null, 2));
                
                let actualJid = participantString;
                
                // Extract the REAL phone number and JID from phoneNumber field
                if (userParticipant && userParticipant.phoneNumber) {
                    actualJid = userParticipant.phoneNumber; // This is the actual WhatsApp JID
                    phoneNumber = userParticipant.phoneNumber.split('@')[0];
                    console.log('📱 Real phone number from phoneNumber field:', phoneNumber);
                    console.log('📱 Actual WhatsApp JID:', actualJid);
                } else {
                    // Fallback: try to extract from participant ID
                    phoneNumber = participantString.split('@')[0];
                    console.log('📱 Phone number from participant ID:', phoneNumber);
                }
                
                // Now try to get push name using the ACTUAL JID
                console.log('🔍 Trying to get push name from actual JID...');
                
                // Method 1: Check for notify in participant data
                if (userParticipant && userParticipant.notify) {
                    displayName = userParticipant.notify;
                    console.log('✅ Found notify name:', displayName);
                }
                
                // Method 2: Try to fetch from WhatsApp using actual JID
                if (!displayName && actualJid) {
                    try {
                        // Check if this number is on WhatsApp and get profile info
                        const [result] = await sock.onWhatsApp(actualJid.split('@')[0]);
                        console.log('📞 WhatsApp check result:', JSON.stringify(result, null, 2));
                        
                        if (result && result.exists) {
                            // Try to get name from contact
                            if (result.name) {
                                displayName = result.name;
                                console.log('✅ Found name from onWhatsApp:', displayName);
                            }
                        }
                    } catch (e) {
                        console.log('Could not get info from onWhatsApp:', e.message);
                    }
                }
                
                // Method 3: Try verifiedName
                if (!displayName && userParticipant && userParticipant.verifiedName) {
                    displayName = userParticipant.verifiedName;
                    console.log('✅ Found verified name:', displayName);
                }
                
                // Method 4: Check if there's a name field
                if (!displayName && userParticipant && userParticipant.name) {
                    displayName = userParticipant.name;
                    console.log('✅ Found name field:', displayName);
                }
                
                // Method 5: Try to get from store using actual JID
                if (!displayName && actualJid && sock.store) {
                    try {
                        const contact = sock.store.contacts[actualJid];
                        if (contact && contact.notify) {
                            displayName = contact.notify;
                            console.log('✅ Found name from store:', displayName);
                        } else if (contact && contact.name) {
                            displayName = contact.name;
                            console.log('✅ Found name field from store:', displayName);
                        }
                    } catch (e) {
                        console.log('Could not get from store:', e.message);
                    }
                }
            } catch (nameError) {
                console.log('❌ Error fetching display name:', nameError.message);
            }
            
            // Fallback to phone number if no name found
            if (!phoneNumber) {
                phoneNumber = participantString.split('@')[0];
            }
            
            if (!displayName) {
                displayName = phoneNumber;
                console.log('⚠️ No name found, using phone number:', displayName);
            } else {
                console.log('✅ Final display name:', displayName);
            }
            
            console.log('✅ Final phone number:', phoneNumber);
            
            // Process custom message with variables
            let finalMessage;
            if (customMessage) {
                finalMessage = customMessage
                    .replace(/{user}/g, `@${displayName || phoneNumber}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc);
            } else {
                // Default message with new format
                finalMessage = `╭━━━━━━━━━━━━━━━╮
┃ 🎉 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗧𝗢 𝗧𝗛𝗘 𝗚𝗥𝗢𝗨𝗣 🎉
┃━━━━━━━━━━━━━━━
┃👤 𝗡𝗮𝗺𝗲: ${displayName || phoneNumber}
┃📱 𝗡𝘂𝗺𝗯𝗲𝗿: ${phoneNumber}
┃👥 𝗠𝗲𝗺𝗯𝗲𝗿: #${groupMetadata.participants.length}
┃🏷️ 𝗚𝗿𝗼𝘂𝗽: ${groupName}
┃⏰ 𝗧𝗶𝗺𝗲: ${currentTime}
┃📅 𝗗𝗮𝘁𝗲: ${currentDate}
┃━━━━━━━━━━━━━━━
┃📋 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻:
┃${groupDesc}
╰━━━━━━━━━━━━━━━╯

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗭𝗢𝗥𝗢 𝗠𝗗* 🚀`;
            }
            
            // Get profile picture with fallback logic: user -> group -> bot
            let profilePicBuffer;
            const fetch = require('node-fetch');
            const fs = require('fs');
            const path = require('path');
            
            // Try to get user's profile picture
            try {
                const profilePic = await sock.profilePictureUrl(participantString, 'image');
                if (profilePic) {
                    const response = await fetch(profilePic);
                    if (response.ok) {
                        profilePicBuffer = await response.buffer();
                    }
                }
            } catch (profileError) {
                console.log('Could not fetch user profile picture, trying group picture...');
            }
            
            // If user has no profile picture, try group picture
            if (!profilePicBuffer) {
                try {
                    const groupPic = await sock.profilePictureUrl(id, 'image');
                    if (groupPic) {
                        const response = await fetch(groupPic);
                        if (response.ok) {
                            profilePicBuffer = await response.buffer();
                        }
                    }
                } catch (groupPicError) {
                    console.log('Could not fetch group profile picture, trying bot picture...');
                }
            }
            
            // If group has no profile picture, try bot picture
            if (!profilePicBuffer) {
                try {
                    const botPic = await sock.profilePictureUrl(sock.user.id, 'image');
                    if (botPic) {
                        const response = await fetch(botPic);
                        if (response.ok) {
                            profilePicBuffer = await response.buffer();
                        }
                    }
                } catch (botPicError) {
                    console.log('Could not fetch bot profile picture, using default image...');
                }
            }
            
            // If no profile pictures available, use default bot image from media
            if (!profilePicBuffer) {
                try {
                    const defaultImagePath = path.join(__dirname, '..', 'media', 'nagiip_md.jpg');
                    if (fs.existsSync(defaultImagePath)) {
                        profilePicBuffer = fs.readFileSync(defaultImagePath);
                    }
                } catch (defaultImageError) {
                    console.log('Could not load default image');
                }
            }
            
            // Send welcome message with profile picture
            if (profilePicBuffer) {
                await sock.sendMessage(id, {
                    image: profilePicBuffer,
                    caption: finalMessage,
                    mentions: [participantString]
                });
            } else {
                // Send text message if no profile picture at all
                await sock.sendMessage(id, {
                    text: finalMessage,
                    mentions: [participantString]
                });
            }
        } catch (error) {
            console.error('Error sending welcome message:', error);
            // Fallback to beautiful text message without image
            try {
                const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
                const phoneNumber = participantString.split('@')[0];
                
                // Get group metadata for fallback
                const groupMetadata = await sock.groupMetadata(id);
                const groupName = groupMetadata.subject;
                const groupDesc = groupMetadata.desc || 'No description available';
                const currentTime = getEastAfricaTime();
                const currentDate = getEastAfricaDate();
                
                let displayName = phoneNumber;
                
                const fallbackMessage = `╭━━━━━━━━━━━━━━━╮
┃ 🎉 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗧𝗢 𝗧𝗛𝗘 𝗚𝗥𝗢𝗨𝗣 🎉
┃━━━━━━━━━━━━━━━
┃👤 𝗡𝗮𝗺𝗲: ${displayName}
┃📱 𝗡𝘂𝗺𝗯𝗲𝗿: ${phoneNumber}
┃👥 𝗠𝗲𝗺𝗯𝗲𝗿: #${groupMetadata.participants.length}
┃🏷️ 𝗚𝗿𝗼𝘂𝗽: ${groupName}
┃⏰ 𝗧𝗶𝗺𝗲: ${currentTime}
┃📅 𝗗𝗮𝘁𝗲: ${currentDate}
┃━━━━━━━━━━━━━━━
┃📋 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻:
┃${groupDesc}
╰━━━━━━━━━━━━━━━╯

> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝗭𝗢𝗥𝗢 𝗠𝗗* 🚀`;
                
                await sock.sendMessage(id, {
                    text: fallbackMessage,
                    mentions: [participantString]
                });
            } catch (fallbackError) {
                console.error('Fallback message also failed:', fallbackError);
            }
        }
    }
}

module.exports = { welcomeCommand, handleJoinEvent };
