const flipMap = {
    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ',
    'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd',
    'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x',
    'y': 'ʎ', 'z': 'z',
    'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ', 'H': 'H',
    'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ',
    'Q': 'Ό', 'R': 'ɹ', 'S': 'S', 'T': '┴', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X',
    'Y': '⅄', 'Z': 'Z',
    '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ',
    '8': '8', '9': '6',
    '.': '˙', ',': '\'', '!': '¡', '?': '¿', '\'': ',', '"': '„', ';': '؛',
    '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<',
    '&': '⅋', '_': '‾'
};

function flipText(text) {
    return text
        .split('')
        .map(char => flipMap[char] || char)
        .reverse()
        .join('');
}

function reverseText(text) {
    return text.split('').reverse().join('');
}

function mirrorText(text) {
    const mirrorChars = {
        'a': 'ɒ', 'b': 'd', 'c': 'ɔ', 'd': 'b', 'e': 'ɘ', 'f': 'ʇ', 'g': 'ǫ', 'h': 'ʜ',
        'i': 'i', 'j': 'ꞁ', 'k': 'ʞ', 'l': '|', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'q',
        'q': 'p', 'r': 'ɿ', 's': 'ƨ', 't': 'ƚ', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x',
        'y': 'ʏ', 'z': 'z',
        'A': 'A', 'B': 'ઘ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'ᖷ', 'G': 'Ǫ', 'H': 'H',
        'I': 'I', 'J': 'Ⴑ', 'K': 'ﻼ', 'L': '⅃', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'ꟼ',
        'Q': 'Ϙ', 'R': 'Я', 'S': 'Ƨ', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X',
        'Y': 'Y', 'Z': 'Z'
    };
    
    return text.split('').map(char => mirrorChars[char] || char).join('');
}

async function fliptextCommand(sock, chatId, message, args) {
    const input = args.join(' ').trim();

    if (!input) {
        await sock.sendMessage(chatId, {
            text: `╭──❍「 *TEXT FLIPPER* 」❍
│ 
│ *Usage:* .fliptext <text>
│ 
│ *Examples:*
│ ➤ .fliptext Hello World
│ ➤ .fliptext ZORO MD
│ ➤ .fliptext ROMEO
│
│ *Features:*
│ • Flips text upside down
│ • Reverses character order
│ • Creates unique effects
│
╰─────────❍`
        }, { quoted: message });
        return;
    }

    try {
        const flipped = flipText(input);
        const reversed = reverseText(input);
        const mirrored = mirrorText(input);

        await sock.sendMessage(chatId, {
            text: `╭──❍「 *TEXT TRANSFORMED* 」❍
│ 
│ *Original:*
│ ${input}
│
│ ┌─❍「 FLIPPED (Upside Down) 」
│ │ ${flipped}
│ └─────────
│
│ ┌─❍「 REVERSED 」
│ │ ${reversed}
│ └─────────
│
│ ┌─❍「 MIRRORED 」
│ │ ${mirrored}
│ └─────────
│
╰─────────❍

© *ZORO MD*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in fliptext command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Error!*\n\nFailed to flip text. Please try again.'
        }, { quoted: message });
    }
}

module.exports = fliptextCommand;
