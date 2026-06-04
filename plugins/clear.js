const isAdmin = require('../lib/isAdmin');

async function clearCommand(sock, chatId, senderId, message) {
    try {
        // Check if it's a group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' }, { quoted: message });
            return;
        }

        // Check if sender is admin
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use the clear command.' }, { quoted: message });
            return;
        }

        const clearMessage = await sock.sendMessage(chatId, { text: 'Clearing bot messages...' });
        const messageKey = clearMessage.key; // Get the key of the message the bot just sent
        
        // Now delete the bot's message
        await sock.sendMessage(chatId, { delete: messageKey });
        
    } catch (error) {
        console.error('Error clearing messages:', error);
        await sock.sendMessage(chatId, { text: 'An error occurred while clearing messages.' });
    }
}

module.exports = { clearCommand };
