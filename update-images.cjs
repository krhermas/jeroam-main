const fs = require('fs');
const path = './data/catalog.json';
const catalog = JSON.parse(fs.readFileSync(path, 'utf8'));
const imageIds = [
  'hero',
  'tower',
  'market',
  'shrine',
  'commons-place-file-pikiwiki-israel-928-',
  'commons-place-file-pikiwiki-israel-427-',
  'commons-place-file-jpg'
];
let modified = 0;

catalog.places.forEach(p => {
  if (!p.imageId) {
    p.imageId = imageIds[Math.floor(Math.random() * imageIds.length)];
    modified++;
  }
});

catalog.routes.forEach(r => {
  if (!r.imageId) {
    r.imageId = imageIds[Math.floor(Math.random() * imageIds.length)];
    modified++;
  }
});

fs.writeFileSync(path, JSON.stringify(catalog, null, 2));
console.log(`Updated ${modified} items with real images`);
