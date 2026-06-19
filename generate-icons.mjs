import sharp from 'sharp';
import { mkdir } from 'fs/promises';

await mkdir('public/icons', { recursive: true });

// SVG: large house + key filling the icon, blue gradient background
function makeSVG(size) {
  const s = size;
  return `<svg width="${s}" height="${s}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="112" ry="112" fill="url(#bg)"/>

  <!-- Roof — wide, starts near top -->
  <polygon points="256,42 470,218 42,218" fill="white" opacity="0.97"/>

  <!-- Chimney -->
  <rect x="340" y="60" width="38" height="80" rx="6" fill="white" opacity="0.85"/>

  <!-- House body — tall, reaches near bottom -->
  <rect x="72" y="212" width="368" height="232" rx="8" fill="white" opacity="0.97"/>

  <!-- Door — centred, tall -->
  <rect x="206" y="312" width="100" height="132" rx="10" fill="#1d4ed8"/>
  <!-- Door knob -->
  <circle cx="296" cy="382" r="8" fill="white" opacity="0.75"/>

  <!-- Left window -->
  <rect x="96" y="252" width="84" height="68" rx="8" fill="#1d4ed8"/>
  <line x1="138" y1="252" x2="138" y2="320" stroke="white" stroke-width="3" opacity="0.3"/>
  <line x1="96"  y1="286" x2="180" y2="286" stroke="white" stroke-width="3" opacity="0.3"/>

  <!-- Right window -->
  <rect x="332" y="252" width="84" height="68" rx="8" fill="#1d4ed8"/>
  <line x1="374" y1="252" x2="374" y2="320" stroke="white" stroke-width="3" opacity="0.3"/>
  <line x1="332" y1="286" x2="416" y2="286" stroke="white" stroke-width="3" opacity="0.3"/>

  <!-- Key badge — bottom right corner -->
  <circle cx="390" cy="390" r="88" fill="#1d4ed8"/>
  <circle cx="390" cy="390" r="82" fill="#fbbf24"/>

  <!-- Key hole in circle -->
  <circle cx="390" cy="390" r="28" fill="#1d4ed8"/>

  <!-- Key shaft -->
  <rect x="412" y="382" width="58" height="16" rx="8" fill="#1d4ed8"/>
  <!-- Key teeth -->
  <rect x="448" y="398" width="10" height="16" rx="4" fill="#1d4ed8"/>
  <rect x="430" y="398" width="10" height="12" rx="4" fill="#1d4ed8"/>
</svg>`;
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = Buffer.from(makeSVG(size));
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`✓ icon-${size}.png`);
}

// Also create a 180x180 for Apple touch icon
const svg180 = Buffer.from(makeSVG(512));
await sharp(svg180)
  .resize(180, 180)
  .png()
  .toFile('public/icons/apple-touch-icon.png');
console.log('✓ apple-touch-icon.png (180x180)');

// favicon 32x32
await sharp(Buffer.from(makeSVG(512)))
  .resize(32, 32)
  .png()
  .toFile('public/favicon.png');
console.log('✓ favicon.png (32x32)');

console.log('\nAll icons generated successfully!');
