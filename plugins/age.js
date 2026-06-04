async function ageCommand(sock, chatId, message, birthYear) {
    if (!birthYear || birthYear.trim() === '') {
        await sock.sendMessage(chatId, {
            text: `╭──❍「 *AGE CALCULATOR* 」❍
│ 
│ *Usage:* .age <birth year>
│ 
│ *Examples:*
│ ➤ .age 2000
│ ➤ .age 1995
│ ➤ .age 2010
│
╰─────────❍`
        }, { quoted: message });
        return;
    }

    try {
        const year = parseInt(birthYear.trim());
        const currentYear = new Date().getFullYear();

        if (isNaN(year)) {
            await sock.sendMessage(chatId, {
                text: '❌ *Invalid year!*\n\nPlease enter a valid birth year.\n*Example:* .age 2000'
            }, { quoted: message });
            return;
        }

        if (year > currentYear) {
            await sock.sendMessage(chatId, {
                text: `❌ *Error!*\n\nBirth year cannot be in the future!\nCurrent year is ${currentYear}.`
            }, { quoted: message });
            return;
        }

        if (year < 1900) {
            await sock.sendMessage(chatId, {
                text: '❌ *Error!*\n\nPlease enter a reasonable birth year (1900 or later).'
            }, { quoted: message });
            return;
        }

        const age = currentYear - year;
        const nextBirthday = currentYear + 1;
        const nextAge = age + 1;

        const now = new Date();
        const monthsLeft = 12 - (now.getMonth() + 1);
        const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
        const daysLeft = daysInMonth - now.getDate();

        await sock.sendMessage(chatId, {
            text: `╭──❍「 *AGE INFORMATION* 」❍
│ 
│ *Birth Year:* ${year}
│ *Current Year:* ${currentYear}
│ 
│ ┌─❍「 YOUR AGE 」
│ │ *${age} years old*
│ └─────────
│
│ ┌─❍「 NEXT BIRTHDAY 」
│ │ *Year:* ${nextBirthday}
│ │ *Age:* ${nextAge} years
│ │ *Approx. Time:* ${monthsLeft} months, ${daysLeft} days
│ └─────────
│
│ ┌─❍「 LIFE STAGES 」
│ │ ${age < 13 ? '👶 Child' : age < 18 ? '👦 Teenager' : age < 30 ? '👨 Young Adult' : age < 50 ? '👨‍💼 Adult' : age < 65 ? '👨‍🦳 Middle Age' : '👴 Senior'}
│ └─────────
│
╰─────────❍

© *NAGIIP ZORO MD*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in age command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Error!*\n\nSomething went wrong. Please try again.\n*Example:* .age 2000'
        }, { quoted: message });
    }
}

module.exports = ageCommand;
