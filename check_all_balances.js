const fs = require('fs');
const content = fs.readFileSync('c:/Users/hp/hi-tech-connect/frontend/src/pages/Admin.tsx', 'utf8');

function checkBalance(text) {
    let braceBalance = 0;
    let parenBalance = 0;
    let divBalance = 0;
    const lines = text.split('\n');

    lines.forEach((line, i) => {
        const lineNo = i + 1;
        // Simple counters for braces and parens
        for (let char of line) {
            if (char === '{') braceBalance++;
            if (char === '}') braceBalance--;
            if (char === '(') parenBalance++;
            if (char === ')') parenBalance--;
        }

        // Divs
        let pos = 0;
        while ((pos = line.indexOf('<div', pos)) !== -1) {
            const endPos = line.indexOf('>', pos);
            if (endPos !== -1) {
                const tag = line.substring(pos, endPos + 1);
                if (!tag.endsWith('/>')) divBalance++;
            }
            pos += 4;
        }
        pos = 0;
        while ((pos = line.indexOf('</div', pos)) !== -1) {
            divBalance--;
            pos += 5;
        }

        if (lineNo > 2100 && (braceBalance !== 0 || parenBalance !== 0 || divBalance !== 0)) {
            // console.log(`Line ${lineNo}: Braces=${braceBalance}, Parens=${parenBalance}, Divs=${divBalance}`);
        }
    });

    console.log(`Final Balances: Braces=${braceBalance}, Parens=${parenBalance}, Divs=${divBalance}`);
}

checkBalance(content);
