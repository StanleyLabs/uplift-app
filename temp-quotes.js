const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/data/quotes.ts');
let content = fs.readFileSync(file, 'utf8');
const themes = ['Hope', 'Resilience', 'Healing', 'Wisdom', 'Strength'];
let themeIndex = 0;
content = content.replace(/\{ id: '(\d+)', text: (.*?), author: (.*?) \}/g, (match, id, text, author) => {
    const theme = themes[themeIndex % themes.length];
    themeIndex++;
    return `{ id: '${id}', text: ${text}, author: ${author}, theme: '${theme}' }`;
});
fs.writeFileSync(file, content);
console.log('Successfully updated quotes.ts');
