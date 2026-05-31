// Script to create a valid .ico file from a PNG using sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const inputPath = path.join(projectRoot, 'build', 'icon_256.png');
const outputPath = path.join(projectRoot, 'build', 'icon.ico');

async function createIco() {
    // Generate multiple sizes for the ICO
    const sizes = [16, 32, 48, 64, 128, 256];
    const images = [];

    for (const size of sizes) {
        const buf = await sharp(inputPath)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        images.push({ size, data: buf });
    }

    // Build ICO file format
    // ICO Header: 6 bytes
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);       // Reserved
    header.writeUInt16LE(1, 2);       // Type: 1 = ICO
    header.writeUInt16LE(images.length, 4); // Number of images

    // Each directory entry: 16 bytes
    const dirEntrySize = 16;
    const dirSize = dirEntrySize * images.length;
    let dataOffset = 6 + dirSize;

    const dirEntries = [];
    for (const img of images) {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);  // Width (0 = 256)
        entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);  // Height (0 = 256)
        entry.writeUInt8(0, 2);          // Color palette
        entry.writeUInt8(0, 3);          // Reserved
        entry.writeUInt16LE(1, 4);       // Color planes
        entry.writeUInt16LE(32, 6);      // Bits per pixel
        entry.writeUInt32LE(img.data.length, 8);   // Size of image data
        entry.writeUInt32LE(dataOffset, 12);        // Offset to image data
        dirEntries.push(entry);
        dataOffset += img.data.length;
    }

    // Combine all parts
    const ico = Buffer.concat([
        header,
        ...dirEntries,
        ...images.map(img => img.data)
    ]);

    fs.writeFileSync(outputPath, ico);
    console.log(`ICO created: ${outputPath} (${ico.length} bytes, ${images.length} sizes)`);
}

createIco().catch(e => { console.error(e); process.exit(1); });
