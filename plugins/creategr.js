async function createGroupCommand(sock, chatId, message, groupName, senderId, isSenderSudo) {
    if (!message.key.fromMe && !isSenderSudo) {
        await sock.sendMessage(chatId, {
            text: '❌ Only the bot owner can create groups!'
        }, { quoted: message });
        return;
    }

    if (!groupName || groupName.trim() === '') {
        await sock.sendMessage(chatId, {
            text: '❌ Please provide a group name!\n\nUsage: .creategr <group name>\nExample: .creategr My New Group'
        }, { quoted: message });
        return;
    }

    try {
        // Get bot's own JID
        const botJid = sock.user.id;
        
        // Normalize sender ID
        let normalizedSender = senderId;
        if (!senderId.includes('@s.whatsapp.net')) {
            normalizedSender = senderId.split(':')[0] + '@s.whatsapp.net';
        }
        
        // Create participants array - must be at least 1 participant
        const participants = [normalizedSender];
        
        console.log('Creating group with:', {
            name: groupName.trim(),
            participants: participants,
            botJid: botJid
        });
        
        // Create the group
        const group = await sock.groupCreate(groupName.trim(), participants);
        
        console.log('Group created:', group);
        
        if (group && group.id) {
            await sock.sendMessage(chatId, {
                text: `✅ *Group Created Successfully!*\n\n📝 *Group Name:* ${groupName}\n🆔 *Group ID:* ${group.id}\n\n🎉 You have been added to the group!`
            }, { quoted: message });

            // Send welcome message to the new group
            setTimeout(async () => {
                try {
                    await sock.sendMessage(group.id, {
                        text: `╭━━━━━━━━━━━━━━━━━╮
│  🎉 *WELCOME*  🎉  │
╰━━━━━━━━━━━━━━━━━╯

Welcome to *${groupName}*!

This group was created by *ZORO MD* 🚀

Enjoy your stay! 💫`
                    });
                } catch (msgError) {
                    console.error('Error sending welcome message:', msgError);
                }
            }, 2000);
        } else {
            throw new Error('Group created but no ID returned');
        }
    } catch (error) {
        console.error('Full error creating group:', error);
        console.error('Error details:', {
            message: error.message,
            data: error.data,
            output: error.output
        });
        
        let errorMessage = '❌ *Failed to create group!*\n\n';
        
        if (error.message) {
            if (error.message.includes('not-authorized') || error.message.includes('forbidden')) {
                errorMessage += '⚠️ *Reason:* Bot account doesn\'t have permission to create groups.\n\n💡 *Note:* WhatsApp may restrict group creation on some accounts for security reasons.';
            } else if (error.message.includes('participant-invalid') || error.message.includes('invalid')) {
                errorMessage += '⚠️ *Reason:* Invalid participant number.\n\n💡 Make sure the number is registered on WhatsApp.';
            } else if (error.message.includes('rate-limit') || error.message.includes('too-many')) {
                errorMessage += '⚠️ *Reason:* Too many groups created recently.\n\n💡 Please wait a few minutes before trying again.';
            } else {
                errorMessage += `⚠️ *Error:* ${error.message}\n\n💡 Please try again later.`;
            }
        } else {
            errorMessage += '⚠️ *Unknown error occurred.*\n\n💡 This might be a WhatsApp restriction on your account.';
        }
        
        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = createGroupCommand;
