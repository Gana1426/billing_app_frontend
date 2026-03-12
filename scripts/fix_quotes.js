const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:/yoburaj/billing_app_frontend';
const APP_DIR = path.join(ROOT_DIR, 'app');
const SRC_DIR = path.join(ROOT_DIR, 'src');

function fixBrokenQuotes(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // It replaced correctly but left off the closing quote?
    // Wait, let's look at what's missing: `import { AuthProvider, useAuth } from '@/context/AuthContext;`
    // It missed the quote before the semicolon.
    // Why did it miss the quote? Ah... wait, maybe p5 was evaluated to something else or I missed passing it properly.
    // I can just regex replace `from '(@/[^;']+);` -> `from '$1';`
    const updatedContent = content.replace(/from (['"])(@\/[^;'"]+);/g, (match, quote, p2) => {
        return `from ${quote}${p2}${quote};`;
    });

    if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Fixed quotes in: ${filePath}`);
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            fixBrokenQuotes(fullPath);
        }
    }
}

walk(APP_DIR);
walk(SRC_DIR);
console.log("Quotes fixed");
