/**
 * Improved Auto-typing Command
 * Features: Separate PM and Group options
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ pm: false, gr: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

async function autotypingCommand(sock, chatId, message, args) {
    try {
        const config = initConfig();
        const argParts = (args || '').trim().toLowerCase().split(' ');
        const [mode, action] = argParts;

        const helpText = `╭━━━━━━━━━━━━━━━━━━╮
│  ⌨️ *AUTO-TYPING*  │
╰━━━━━━━━━━━━━━━━━━╯

*Commands:*
┌─────────────────
│ .autotyping pm on
├ Enable for private messages
│
│ .autotyping pm off
├ Disable for private messages
│
│ .autotyping gr on
├ Enable for groups
│
│ .autotyping gr off
├ Disable for groups
│
│ .autotyping status
├ Show current settings
└─────────────────

*Current Status:*
• PM: ${config.pm ? '✅ ON' : '❌ OFF'}
• Groups: ${config.gr ? '✅ ON' : '❌ OFF'}

*Note:* Shows typing indicator before replying`;

        if (!mode || !['pm', 'gr', 'status'].includes(mode)) {
            await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
            return;
        }

        if (mode === 'status') {
            await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
            return;
        }

        if (!action || !['on', 'off'].includes(action)) {
            await sock.sendMessage(chatId, { 
                text: `❌ Use: .autotyping ${mode} on/off` 
            }, { quoted: message });
            return;
        }

        config[mode] = action === 'on';
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const modeText = mode === 'pm' ? 'private messages' : 'groups';
        const icon = action === 'on' ? '✅' : '❌';
        
        await sock.sendMessage(chatId, { 
            text: `${icon} Auto-typing for *${modeText}* ${action === 'on' ? 'enabled' : 'disabled'}!` 
        }, { quoted: message });
        
    } catch (error) {
        console.error('Error in autotyping command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error processing command!',
        });
    }
}

function isAutotypingEnabled(isGroup) {
    try {
        const config = initConfig();
        return isGroup ? config.gr : config.pm;
    } catch (error) {
        console.error('Error checking autotyping status:', error);
        return false;
    }
}

async function handleAutotypingForMessage(sock, chatId, userMessage, isGroup) {
    if (isAutotypingEnabled(isGroup)) {
        try {
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 500));
            await sock.sendPresenceUpdate('composing', chatId);
            
            const typingDelay = Math.max(2000, Math.min(6000, userMessage.length * 100));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            await sock.sendPresenceUpdate('paused', chatId);
            return true;
        } catch (error) {
            console.error('❌ Error sending typing indicator:', error);
            return false;
        }
    }
    return false;
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage
};
