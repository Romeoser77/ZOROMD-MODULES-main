/**
 * Knight Bot - A WhatsApp Bot
 * Autotyping Command - Shows fake typing status
 */

const fs = require('fs');
const path = require('path');

// Path to store the configuration
const configPath = path.join(__dirname, '..', 'data', 'autotyping.json');

// Initialize configuration file if it doesn't exist
function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ pm: false, gr: false }, null, 2));
    }
    return JSON.parse(fs.readFileSync(configPath));
}

// Toggle autotyping feature
async function autotypingCommand(sock, chatId, message) {
    try {
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner!',
                });
            return;
        }

        const args = message.message?.conversation?.trim().split(' ').slice(1) || 
                    message.message?.extendedTextMessage?.text?.trim().split(' ').slice(1) || 
                    [];
        
        const config = initConfig();
        
        if (args.length === 0) {
            await sock.sendMessage(chatId, {
                text: `*AUTO-TYPING*\n\n.autotyping pm on - Enable for private messages\n.autotyping pm off - Disable for PM\n.autotyping gr on - Enable for groups\n.autotyping gr off - Disable for groups\n\nCurrent Status:\nPM: ${config.pm ? 'ON ✅' : 'OFF ❌'}\nGroups: ${config.gr ? 'ON ✅' : 'OFF ❌'}`,
                });
            return;
        }
        
        const [mode, action] = args;
        
        if (!mode || !['pm', 'gr'].includes(mode.toLowerCase())) {
            await sock.sendMessage(chatId, {
                text: '❌ Invalid mode! Use: .autotyping pm/gr on/off',
                });
            return;
        }
        
        if (!action || !['on', 'off'].includes(action.toLowerCase())) {
            await sock.sendMessage(chatId, {
                text: '❌ Invalid action! Use: .autotyping pm/gr on/off',
                });
            return;
        }
        
        config[mode.toLowerCase()] = action.toLowerCase() === 'on';
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        await sock.sendMessage(chatId, {
            text: `✅ Auto-typing for ${mode.toLowerCase() === 'pm' ? 'private messages' : 'groups'} has been ${action.toLowerCase() === 'on' ? 'enabled' : 'disabled'}!`,
            });
        
    } catch (error) {
        console.error('Error in autotyping command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error processing command!',
            });
    }
}

// Function to check if autotyping is enabled for a specific chat type
function isAutotypingEnabled(isGroup) {
    try {
        const config = initConfig();
        return isGroup ? config.gr : config.pm;
    } catch (error) {
        console.error('Error checking autotyping status:', error);
        return false;
    }
}

// Function to handle autotyping for regular messages
async function handleAutotypingForMessage(sock, chatId, userMessage, isGroup) {
    if (isAutotypingEnabled(isGroup)) {
        try {
            await sock.presenceSubscribe(chatId);
            
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            await sock.sendPresenceUpdate('composing', chatId);
            
            const baseDelay = isGroup ? 2500 : 2000;
            const messageDelay = userMessage ? Math.min(4000, userMessage.length * 80) : 2000;
            const typingDelay = baseDelay + messageDelay;
            
            await new Promise(resolve => setTimeout(resolve, typingDelay));
            
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error sending typing indicator:', error);
            return false;
        }
    }
    return false;
}

// Function to handle autotyping for commands
async function handleAutotypingForCommand(sock, chatId, isGroup) {
    if (isAutotypingEnabled(isGroup)) {
        try {
            await sock.presenceSubscribe(chatId);
            
            await sock.sendPresenceUpdate('available', chatId);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            await sock.sendPresenceUpdate('composing', chatId);
            
            const commandTypingDelay = isGroup ? 2000 : 1500;
            await new Promise(resolve => setTimeout(resolve, commandTypingDelay));
            
            await sock.sendPresenceUpdate('composing', chatId);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error sending command typing indicator:', error);
            return false;
        }
    }
    return false;
}

// Function to show typing status AFTER command execution
async function showTypingAfterCommand(sock, chatId, isGroup) {
    if (isAutotypingEnabled(isGroup)) {
        try {
            await sock.presenceSubscribe(chatId);
            
            await sock.sendPresenceUpdate('composing', chatId);
            
            const afterDelay = isGroup ? 1200 : 800;
            await new Promise(resolve => setTimeout(resolve, afterDelay));
            
            await sock.sendPresenceUpdate('paused', chatId);
            
            return true;
        } catch (error) {
            console.error('❌ Error sending post-command typing indicator:', error);
            return false;
        }
    }
    return false;
}

module.exports = {
    autotypingCommand,
    isAutotypingEnabled,
    handleAutotypingForMessage,
    handleAutotypingForCommand,
    showTypingAfterCommand
};