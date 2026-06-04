async function groupInfoCommand(sock, chatId, msg) {
    try {
        // Check if this is a group
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: '❌ This command only works in groups!' }, { quoted: msg });
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        
        if (!groupMetadata) {
            return await sock.sendMessage(chatId, { text: '❌ Failed to get group info!' }, { quoted: msg });
        }

        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }

        // Get admins from participants
        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.length > 0 
            ? groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n')
            : 'No admins found';
        
        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // Create info text
        const text = `
┌──「 *𝗜𝗡𝗙𝗢 𝗚𝗥𝗢𝗨𝗣* 」
▢ *♻️𝗜𝗗:*
   • ${groupMetadata.id}
▢ *🔖𝗡𝗔𝗠𝗘* : 
• ${groupMetadata.subject}
▢ *👥𝗠𝗲𝗺𝗯𝗲𝗿𝘀* :
• ${participants.length}
▢ *🤿𝗚𝗿𝗼𝘂𝗽 𝗢𝘄𝗻𝗲𝗿:*
• @${owner.split('@')[0]}
▢ *🕵🏻‍♂️𝗔𝗱𝗺𝗶𝗻𝘀:*
${listAdmin}

▢ *📌𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻* :
   • ${groupMetadata.desc?.toString() || 'No description'}
`.trim();

        // Send the message with image and mentions
        const mentions = groupAdmins.length > 0 ? [...groupAdmins.map(v => v.id), owner] : [owner];
        
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: mentions
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in groupinfo command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ Failed to get group info!\nError: ${error.message || 'Unknown error'}` 
        }, { quoted: msg });
    }
}

module.exports = groupInfoCommand; 