const fs = require('fs');
const path = require('path');

const distElectron = path.join(__dirname, '..', 'dist-electron');

if (fs.existsSync(distElectron)) {
    const files = fs.readdirSync(distElectron);

    files.forEach(file => {
        if (file.endsWith('.js')) {
            const oldPath = path.join(distElectron, file);
            const newPath = path.join(distElectron, file.replace('.js', '.cjs'));

            // Read content to fix requires if necessary
            let content = fs.readFileSync(oldPath, 'utf8');

            // If converting main.js, ensure it references preload.cjs
            if (file === 'main.js') {
                content = content.replace("require('path').join(__dirname, 'preload.js')", "require('path').join(__dirname, 'preload.cjs')");
                // Also catch cases where path.join arguments might be separate
                content = content.replace("'preload.js'", "'preload.cjs'");
                content = content.replace('"preload.js"', '"preload.cjs"');
            }

            fs.writeFileSync(newPath, content);
            console.log(`✓ Renamed/Patched: ${file} -> ${path.basename(newPath)}`);

            // Delete old .js file to avoid confusion
            fs.unlinkSync(oldPath);
            console.log(`✓ Deleted old: ${file}`);
        }
    });

    console.log('\n✅ Electron files renamed to .cjs successfully.');
} else {
    console.log('⚠ dist-electron not found, skipping rename.');
}
