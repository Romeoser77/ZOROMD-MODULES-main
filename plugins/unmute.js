const isAdmin = require('../lib/isAdmin');

async function unmuteCommand(sock, chatId, senderId, message) {
    // Check if it's a group
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' }, { quoted: message });
        return;
    }

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'Only group admins can use the unmute command.' }, { quoted: message });
        return;
    }

    await sock.groupSettingUpdate(chatId, 'not_announcement'); // Unmute the group
    await sock.sendMessage(chatId, { text: 'The group has been unmuted.' }, { quoted: message });
}

module.exports = unmuteCommand;
