const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'icons-dom.html'), 'utf8');
const start192 = html.lastIndexOf('<textarea id="t192">');
const end192 = html.indexOf('</textarea>', start192);
const start512 = html.lastIndexOf('<textarea id="t512">');
const end512 = html.indexOf('</textarea>', start512);

console.log({ start192, end192, start512, end512 });

if (start192 !== -1 && end192 !== -1) {
  const content192 = html.slice(start192 + '<textarea id="t192">'.length, end192).trim();
  console.log('content192 length:', content192.length, 'head:', content192.substring(0, 30));
  const buf = Buffer.from(content192, 'base64');
  const iconsDir = path.join(__dirname, '..', 'icons');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), buf);
  console.log('icon-192.png written:', buf.length, 'bytes');
}

if (start512 !== -1 && end512 !== -1) {
  const content512 = html.slice(start512 + '<textarea id="t512">'.length, end512).trim();
  console.log('content512 length:', content512.length, 'head:', content512.substring(0, 30));
  const buf = Buffer.from(content512, 'base64');
  const iconsDir = path.join(__dirname, '..', 'icons');
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), buf);
  console.log('icon-512.png written:', buf.length, 'bytes');
}
