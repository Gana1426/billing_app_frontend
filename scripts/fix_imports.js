const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:/yoburaj/billing_app_frontend';
const APP_DIR = path.join(ROOT_DIR, 'app');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const knownFolders = ["components", "constants", "context", "database", "db", "hooks", "services", "utils", "screens", "navigation"];

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Regex matches: 'import ... from "../components/..."' or '"../../db/..."'
    const updatedContent = content.replace(/(['"])((?:\.\.\/)+)([^/'"]+)(\/[^'"]*)(['"])/g, (match, p1, p2, folder, rest, p5) => {
        if (folder === 'db') {
            folder = 'database';
        }
        if (knownFolders.includes(folder)) {
            return `${p1}@/${folder}${rest}${p5}`;
        }
        return match;
    }).replace(/(['"])(\.\/)([^/'"]+)(\/[^'"]*)(['"])/g, (match, p1, p2, folder, rest, p5) => {
        // matches `./db/` or `./utils/` in root level or something... wait, `./` is tricky.
        if (folder === 'db' && filePath.includes(path.join(ROOT_DIR, 'src')) && path.dirname(filePath) === SRC_DIR) {
            folder = 'database';
        }
        return match;
    });

    if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated: ${filePath}`);
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
            processFile(fullPath);
        }
    }
}

walk(APP_DIR);
walk(SRC_DIR);
console.log("Done");
