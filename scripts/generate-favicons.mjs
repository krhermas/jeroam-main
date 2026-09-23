import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function generateAll() {
  const logoPath = 'public/images/jeroam-logo.jpg';

  // Crop the true mark (370x370 from (205, 111))
  const markBuffer = await sharp(logoPath)
    .extract({ left: 205, top: 111, width: 370, height: 370 })
    .resize(206, 206, { fit: 'contain' })
    .png()
    .toBuffer();

  const markBase64 = markBuffer.toString('base64');

  // 1. Generate public/favicon.svg
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <clipPath id="squircle">
      <rect x="5" y="5" width="246" height="246" rx="54"/>
    </clipPath>
  </defs>
  <rect x="5" y="5" width="246" height="246" rx="54" fill="#ffffff" stroke="#f5a623" stroke-width="8"/>
  <g clip-path="url(#squircle)">
    <image href="data:image/png;base64,${markBase64}" x="25" y="25" width="206" height="206"/>
  </g>
</svg>`;

  fs.writeFileSync('public/favicon.svg', svgContent.trim());
  console.log('Saved public/favicon.svg');

  // 2. Generate high-res squircle PNG (256x256)
  const squircleSvg = `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="246" height="246" rx="54" fill="#ffffff" stroke="#f5a623" stroke-width="8"/>
    </svg>
  `;

  const masterPng = await sharp(Buffer.from(squircleSvg))
    .composite([{ input: markBuffer, top: 25, left: 25 }])
    .png()
    .toBuffer();

  fs.writeFileSync('public/favicon.png', masterPng);
  fs.writeFileSync('app/icon.png', masterPng);

  // 3. Apple Touch Icon (180x180)
  const appleTouchIcon = await sharp(masterPng).resize(180, 180).png().toBuffer();
  fs.writeFileSync('public/apple-touch-icon.png', appleTouchIcon);

  // 4. Generate multi-resolution ICO (16, 32, 48)
  const png16 = await sharp(masterPng).resize(16, 16).png().toBuffer();
  const png32 = await sharp(masterPng).resize(32, 32).png().toBuffer();
  const png48 = await sharp(masterPng).resize(48, 48).png().toBuffer();

  const images = [
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ];

  const headerSize = 6;
  const dirEntrySize = 16;
  const totalHeaderSize = headerSize + images.length * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type: 1 = ICO
  header.writeUInt16LE(images.length, 4); // Number of images

  let currentOffset = totalHeaderSize;
  const dirEntries = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.size, 0); // Width
    entry.writeUInt8(img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data
    dirEntries.push(entry);
    imageBuffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  fs.writeFileSync('app/favicon.ico', icoBuffer);
  console.log('Saved favicon.ico to public and app directories');

  // Clean up temporary test files
  const tempFiles = [
    'public/test-circle.png',
    'public/test-squircle.png',
    'public/favicon-mark.png',
    'public/favicon-mark2.png',
    'public/favicon-pure-mark.png'
  ];
  for (const file of tempFiles) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  console.log('Finished generating all logo favicons and cleaned up temp files.');
}

generateAll().catch(console.error);
