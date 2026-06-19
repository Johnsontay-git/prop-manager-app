import sharp from 'sharp';
import { mkdir } from 'fs/promises';

await mkdir('public/icons', { recursive: true });

// SVG: house + key on blue gradient, sized at 512x512
function makeSVG(size) {
  const s = size;
  return `<svg width="${s}" height="${s}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" ry="112" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <rect width="512" height="512" rx="112" ry="112" fill="white" opacity="0.06"/>

  <!-- House body -->
  <!-- Roof (triangle) -->
  <polygon points="256,100 420,240 92,240" fill="white" opacity="0.95"/>
  <!-- Roof ridge line -->
  <polygon points="256,108 412,240 100,240" fill="white" opacity="0.12"/>

  <!-- Main house body -->
  <rect x="132" y="238" width="248" height="168" rx="6" fill="white" opacity="0.95"/>

  <!-- Door -->
  <rect x="216" y="314" width="80" height="92" rx="8" fill="#1d4ed8"/>
  <!-- Door knob -->
  <circle cx="288" cy="364" r="6" fill="white" opacity="0.7"/>

  <!-- Left window -->
  <rect x="150" y="270" width="52" height="44" rx="6" fill="#1d4ed8"/>
  <line x1="176" y1="270" x2="176" y2="314" stroke="white" stroke-width="2.5" opacity="0.3"/>
  <line x1="150" y1="292" x2="202" y2="292" stroke="white" stroke-width="2.5" opacity="0.3"/>

  <!-- Right window -->
  <rect x="310" y="270" width="52" height="44" rx="6" fill="#1d4ed8"/>
  <line x1="336" y1="270" x2="336" y2="314" stroke="white" stroke-width="2.5" opacity="0.3"/>
  <line x1="310" y1="292" x2="362" y2="292" stroke="white" stroke-width="2.5" opacity="0.3"/>

  <!-- Key (bottom right, overlapping) -->
  <g transform="translate(295, 340)">
    <!-- Key circle head -->
    <circle cx="60" cy="60" r="38" fill="#fbbf24" stroke="white" stroke-width="6"/>
    <circle cx="60" cy="60" r="22" fill="#1d4ed8"/>

    <!-- Key shaft -->
    <rect x="90" y="52" width="78" height="16" rx="8" fill="#fbbf24" stroke="white" stroke-width="4"/>

    <!-- Key teeth -->
    <rect x="138" y="68" width="12" height="18" rx="4" fill="#fbbf24" stroke="white" stroke-width="3"/>
    <rect x="158" y="68" width="10" height="14" rx="4" fill="#fbbf24" stroke="white" stroke-width="3"/>
  </g>
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
