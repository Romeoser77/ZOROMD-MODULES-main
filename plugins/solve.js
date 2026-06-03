const math = require('mathjs');

async function solveCommand(sock, chatId, message, expression) {
    if (!expression || expression.trim() === '') {
        await sock.sendMessage(chatId, {
            text: `╭──❍「 *MATH SOLVER* 」❍
│ 
│ *Usage:* .solve <expression>
│ 
│ *Examples:*
│ ➤ .solve 25 + 75
│ ➤ .solve 100 - 45
│ ➤ .solve 12 × 8
│ ➤ .solve 144 ÷ 12
│ ➤ .solve 2^8
│ ➤ .solve sqrt(144)
│ ➤ .solve (20 + 5) × 3
│
│ *Supported Operations:*
│ ➤ Addition: +
│ ➤ Subtraction: -
│ ➤ Multiplication: × or *
│ ➤ Division: ÷ or /
│ ➤ Power: ^
│ ➤ Square root: sqrt()
│ ➤ Parentheses: ()
│
╰─────────❍`
        }, { quoted: message });
        return;
    }

    try {
        let processedExpression = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/x/gi, '*');

        const result = math.evaluate(processedExpression);

        const formattedResult = typeof result === 'number' 
            ? (Number.isInteger(result) ? result : result.toFixed(6).replace(/\.?0+$/, ''))
            : result;

        await sock.sendMessage(chatId, {
            text: `╭──❍「 *CALCULATION RESULT* 」❍
│ 
│ *Question:* ${expression}
│ 
│ *Answer:* ${formattedResult}
│
╰─────────❍

© *ZORO MD*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in solve command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Error!*

Unable to solve this expression. Please check:
• Make sure the math expression is correct
• Use proper operators (+, -, ×, ÷, ^)
• Check parentheses are balanced

*Example:* .solve (10 + 5) × 2`
        }, { quoted: message });
    }
}

module.exports = solveCommand;
