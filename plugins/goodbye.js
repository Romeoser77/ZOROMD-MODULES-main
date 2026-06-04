const { handleGoodbye } = require('../lib/welcome');
const { isGoodByeOn, getGoodbye } = require('../lib/index');

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

async function goodbyeCommand(sock, chatId, message, match) {
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
            text: '❌ Only group admins can manage goodbye messages.' 
        });
        return;
    }

    // Extract match from message
    const text = message.message?.conversation || 
                message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');

    await handleGoodbye(sock, chatId, message, matchText);
}

async function handleLeaveEvent(sock, id, participants) {
    // Check if goodbye is enabled for this group
    const isGoodbyeEnabled = await isGoodByeOn(id);
    if (!isGoodbyeEnabled) return;

    // Get custom goodbye message
    const customMessage = await getGoodbye(id);

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const currentTime = getEastAfricaTime();
    const currentDate = getEastAfricaDate();
    const remainingMembers = groupMetadata.participants.length;

    // Send goodbye message for each leaving participant
    for (const participant of participants) {
        try {
            // Handle case where participant might be an object or not a string
            const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
            
            console.log('👋 Processing leaving participant:', participantString);
            
            // Get user's display name and actual phone number
            let displayName = null;
            let phoneNumber = null;
            
            try {
                // Note: For goodbye, we need to check stored contact data since user already left
                // We'll try to get the phoneNumber from baileys store or from the participant format
                
                // First try to find in group metadata before they left (might still be cached)
                try {
                    const freshGroupMetadata = await sock.groupMetadata(id);
                    const userParticipant = freshGroupMetadata.participants.find(p => p.id === participantString);
                    
                    if (userParticipant) {
                        console.log('👤 Found participant data:', JSON.stringify(userParticipant, null, 2));
                        
                        // Extract real phone number
                        if (userParticipant.phoneNumber) {
                            phoneNumber = userParticipant.phoneNumber.split('@')[0];
                            console.log('📱 Real phone number:', phoneNumber);
                        }
                        
                        // Get display name
                        if (userParticipant.notify) {
                            displayName = userParticipant.notify;
                            console.log('✅ Found notify name:', displayName);
                        } else if (userParticipant.verifiedName) {
                            displayName = userParticipant.verifiedName;
                            console.log('✅ Found verified name:', displayName);
                        } else if (userParticipant.name) {
                            displayName = userParticipant.name;
                            console.log('✅ Found name field:', displayName);
                        }
                    }
                } catch (e) {
                    console.log('Could not get participant from group metadata');
                }
            } catch (nameError) {
                console.log('Error fetching display name:', nameError.message);
            }
            
            // Fallback to extracting from participant ID
            if (!phoneNumber) {
                phoneNumber = participantString.split('@')[0];
                console.log('📱 Fallback phone number:', phoneNumber);
            }
            
            // If no name found, use phone number
            if (!displayName) {
                displayName = phoneNumber;
                console.log('⚠️ No name found, using phone number');
            }
            
            console.log('✅ Final name:', displayName);
            console.log('✅ Final number:', phoneNumber);
            
            // Process custom message with variables
            let finalMessage;
            if (customMessage) {
                finalMessage = customMessage
                    .replace(/{user}/g, `@${displayName || phoneNumber}`)
                    .replace(/{group}/g, groupName);
            } else {
                // Default message with new format
                finalMessage = `╭━━━━━━━━━━━━━━━╮
┃ 👋 𝗚𝗢𝗢𝗗𝗕𝗬𝗘 👋
┃━━━━━━━━━━━━━━━
┃👤 𝗡𝗮𝗺𝗲: ${displayName || phoneNumber}
┃📱 𝗡𝘂𝗺𝗯𝗲𝗿: ${phoneNumber}
┃🏷️ 𝗟𝗲𝗳𝘁: ${groupName}
┃👥 𝗥𝗲𝗺𝗮𝗶𝗻𝗶𝗻𝗴: ${remainingMembers} members
┃⏰ 𝗧𝗶𝗺𝗲: ${currentTime}
┃📅 𝗗𝗮𝘁𝗲: ${currentDate}
╰━━━━━━━━━━━━━━━╯

*We'll miss you!* 💔`;
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
                    const defaultImagePath = path.join(__dirname, '..', 'media', 'zoro_md.jpg');
                    if (fs.existsSync(defaultImagePath)) {
                        profilePicBuffer = fs.readFileSync(defaultImagePath);
                    }
                } catch (defaultImageError) {
                    console.log('Could not load default image');
                }
            }
            
            // Send goodbye message with profile picture
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
            console.error('Error sending goodbye message:', error);
            // Fallback to beautiful text message without image
            try {
                const participantString = typeof participant === 'string' ? participant : (participant.id || participant.toString());
                const phoneNumber = participantString.split('@')[0];
                
                // Get group metadata for fallback
                const groupMetadata = await sock.groupMetadata(id);
                const groupName = groupMetadata.subject;
                const currentTime = getEastAfricaTime();
                const currentDate = getEastAfricaDate();
                const remainingMembers = groupMetadata.participants.length;
                
                let displayName = phoneNumber;
                
                const fallbackMessage = `╭━━━━━━━━━━━━━━━╮
┃ 👋 𝗚𝗢𝗢𝗗𝗕𝗬𝗘 👋
┃━━━━━━━━━━━━━━━
┃👤 𝗡𝗮𝗺𝗲: ${displayName}
┃📱 𝗡𝘂𝗺𝗯𝗲𝗿: ${phoneNumber}
┃🏷️ 𝗟𝗲𝗳𝘁: ${groupName}
┃👥 𝗥𝗲𝗺𝗮𝗶𝗻𝗶𝗻𝗴: ${remainingMembers} members
┃⏰ 𝗧𝗶𝗺𝗲: ${currentTime}
┃📅 𝗗𝗮𝘁𝗲: ${currentDate}
╰━━━━━━━━━━━━━━━╯

*We'll miss you!* 💔`;
                
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

module.exports = { goodbyeCommand, handleLeaveEvent };
