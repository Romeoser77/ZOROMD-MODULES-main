const chalk = require('chalk');

class ConsoleLogger {
    constructor() {
        this.colors = {
            cyan: '\x1b[36m',
            magenta: '\x1b[35m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            blue: '\x1b[34m',
            red: '\x1b[31m',
            white: '\x1b[37m',
            reset: '\x1b[0m'
        };
    }

    // Gradient effect using multiple colors
    gradient(text, colorArray) {
        const chars = text.split('');
        return chars.map((char, i) => {
            const colorIndex = Math.floor((i / chars.length) * colorArray.length);
            return colorArray[colorIndex] + char;
        }).join('') + this.colors.reset;
    }

    // Log incoming message from WhatsApp
    logIncomingMessage(sender, senderName, message, isGroup = false, groupName = '') {
        const timestamp = new Date().toLocaleTimeString();
        
        if (isGroup) {
            // Group message with gradient colors
            console.log('\n' + chalk.bgCyan.black('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk.cyan('┌─ 📨 GROUP MESSAGE'));
            console.log(chalk.cyan('├─ 👥 Group:'), chalk.bold.yellow(groupName));
            console.log(chalk.cyan('├─ 👤 Sender:'), chalk.bold.blue(senderName));
            console.log(chalk.cyan('├─ 📱 JID:'), chalk.gray(sender));
            console.log(chalk.cyan('├─ 🕐 Time:'), chalk.bold.magenta(timestamp));
            console.log(chalk.cyan('├─ 💬 Message:'));
            console.log(chalk.cyan('│'), chalk.bold.green(message.substring(0, 100) + (message.length > 100 ? '...' : '')));
            console.log(chalk.cyan('└─' + '═'.repeat(32)));
        } else {
            // Private message with gradient
            console.log('\n' + chalk.bgBlue.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk.blue('┌─ 💌 PRIVATE MESSAGE'));
            console.log(chalk.blue('├─ 👤 From:'), chalk.bold.green(senderName));
            console.log(chalk.blue('├─ 📱 JID:'), chalk.gray(sender));
            console.log(chalk.blue('├─ 🕐 Time:'), chalk.bold.magenta(timestamp));
            console.log(chalk.blue('├─ 💬 Message:'));
            console.log(chalk.blue('│'), chalk.bold.cyan(message.substring(0, 100) + (message.length > 100 ? '...' : '')));
            console.log(chalk.blue('└─' + '═'.repeat(32)));
        }
    }

    // Log command usage
    logCommandUsage(commandName, sender, senderName, isPrivate = false, groupName = '') {
        const timestamp = new Date().toLocaleTimeString();
        const isAdmin = false; // This can be passed as parameter if needed
        
        console.log('\n' + chalk.bgMagenta.white('╔════════════════════════════════════╗'));
        console.log(chalk.magenta('║'), chalk.bold.yellow('⚡ ZORO COMMAND EXECUTED'));
        console.log(chalk.magenta('╠════════════════════════════════════╣'));
        console.log(chalk.magenta('║'), chalk.bold.cyan(`Command: ${commandName}`));
        console.log(chalk.magenta('║'), chalk.bold.green(`User: ${senderName}`));
        
        if (!isPrivate) {
            console.log(chalk.magenta('║'), chalk.bold.blue(`Group: ${groupName}`));
        }
        
        console.log(chalk.magenta('║'), chalk.bold.red(`Type: ${isPrivate ? 'PRIVATE' : 'GROUP'}`));
        console.log(chalk.magenta('║'), chalk.bold.yellow(`Time: ${timestamp}`));
        console.log(chalk.magenta('║'), chalk.gray(`JID: ${sender}`));
        console.log(chalk.magenta('╚════════════════════════════════════╝'));
    }

    // Log bot response
    logBotResponse(chatId, response, responseType = 'text') {
        console.log('\n' + chalk.bgGreen.black('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green('┌─ ✅ BOT RESPONSE'));
        console.log(chalk.green('├─ 📨 To:'), chalk.bold.cyan(chatId));
        console.log(chalk.green('├─ 📝 Type:'), chalk.bold.yellow(responseType.toUpperCase()));
        console.log(chalk.green('├─ 💬 Content:'));
        console.log(chalk.green('│'), chalk.white(response.substring(0, 100) + (response.length > 100 ? '...' : '')));
        console.log(chalk.green('└─' + '═'.repeat(32)));
    }

    // Log error
    logError(errorMessage, context = '') {
        console.log('\n' + chalk.bgRed.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.red('❌ ERROR'));
        if (context) {
            console.log(chalk.red('Context:'), chalk.yellow(context));
        }
        console.log(chalk.red('Message:'), chalk.bold.red(errorMessage));
        console.log(chalk.red('└─' + '═'.repeat(32)));
    }
}

module.exports = new ConsoleLogger();
