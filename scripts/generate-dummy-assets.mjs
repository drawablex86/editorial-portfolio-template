import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateSvgWebp(svgString, outPath, width = 1200, height = 800) {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await sharp(Buffer.from(svgString)).webp({ quality: 85 }).toFile(outPath);
  console.log('Generated:', outPath);
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function run() {
  // 1. Avatar (Linus Torvalds placeholder)
  const avatarSvg = `
  <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="600" fill="#2C2B29"/>
    <circle cx="300" cy="240" r="120" fill="#E8E6DF"/>
    <path d="M120 540 C120 400 480 400 480 540 Z" fill="#E8E6DF"/>
    <text x="300" y="570" font-family="monospace" font-size="28" fill="#A8A29E" text-anchor="middle">LINUS TORVALDS</text>
  </svg>`;
  await generateSvgWebp(avatarSvg, 'static/images/avatar.webp', 600, 600);

  // 2. Schematics 1 to 7 for 3D Desk
  const deskSpecs = [
    { title: 'VFS Page Cache Subsystem', code: 'KERNEL // VFS-PAGE-CACHE-v6.8' },
    { title: 'Git Object Graph &amp; DAG', code: 'VERSION-CONTROL // SHA-TREE-DAG' },
    { title: 'Instruction Pipeline Trace', code: 'ARCH // x86-64-PIPELINE' },
    { title: 'Lockless Ring Buffer', code: 'MEMORY // ATOMIC-RING-BUFFER' },
    { title: 'Optics &amp; Ray Tracing Study', code: 'OPTICS // 50MM-PRIME-RAY-PATH' },
    { title: 'Hardware Bus Topology', code: 'BUS // PCIE-GEN5-INTERCONNECT' },
    { title: 'Interrupt Controller Topology', code: 'SYSTEM // APIC-DISPATCH-MAP' },
  ];

  for (let i = 0; i < deskSpecs.length; i++) {
    const spec = deskSpecs[i];
    const svg = `
    <svg width="1000" height="1300" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1300" fill="#FAF9F5"/>
      <rect x="40" y="40" width="920" height="1220" fill="none" stroke="#2C2B29" stroke-width="2"/>
      <line x1="40" y1="120" x2="960" y2="120" stroke="#2C2B29" stroke-width="1"/>
      <text x="80" y="90" font-family="monospace" font-size="24" font-weight="bold" fill="#2C2B29">${spec.code}</text>
      <text x="80" y="180" font-family="serif" font-size="36" fill="#2C2B29">${spec.title}</text>
      
      <g stroke="#E8E6DF" stroke-width="1">
        <line x1="80" y1="240" x2="920" y2="240"/>
        <line x1="80" y1="360" x2="920" y2="360"/>
        <line x1="80" y1="480" x2="920" y2="480"/>
        <line x1="80" y1="600" x2="920" y2="600"/>
        <line x1="80" y1="720" x2="920" y2="720"/>
        <line x1="80" y1="840" x2="920" y2="840"/>
        <line x1="80" y1="960" x2="920" y2="960"/>
        <line x1="280" y1="240" x2="280" y2="1080"/>
        <line x1="500" y1="240" x2="500" y2="1080"/>
        <line x1="720" y1="240" x2="720" y2="1080"/>
      </g>
      
      <rect x="140" y="300" width="280" height="160" fill="#2C2B29" rx="8"/>
      <text x="280" y="390" font-family="monospace" font-size="20" fill="#FAF9F5" text-anchor="middle">BLOCK ${i + 1}.0</text>
      
      <circle cx="680" cy="380" r="80" fill="none" stroke="#2C2B29" stroke-width="4"/>
      <text x="680" y="388" font-family="monospace" font-size="18" fill="#2C2B29" text-anchor="middle">STATE NODE</text>
      
      <path d="M 420 380 L 600 380" stroke="#2C2B29" stroke-width="3"/>
      <path d="M 680 460 L 680 620 L 300 620" fill="none" stroke="#2C2B29" stroke-width="2" stroke-dasharray="8,8"/>

      <rect x="140" y="700" width="720" height="240" fill="none" stroke="#2C2B29" stroke-width="2"/>
      <text x="180" y="750" font-family="monospace" font-size="18" fill="#78716C">REGISTER STATE // TRACE MATRIX</text>
      <text x="180" y="800" font-family="monospace" font-size="16" fill="#2C2B29">0x000000007FFE4000 : 00 FF 8A C4 01 22 4A 1B</text>
      <text x="180" y="840" font-family="monospace" font-size="16" fill="#2C2B29">0x000000007FFE4020 : E8 4F 11 00 90 90 48 89</text>
      <text x="180" y="880" font-family="monospace" font-size="16" fill="#2C2B29">FLAGS: [CF:0 PF:1 AF:0 ZF:0 SF:0 TF:0 IF:1 DF:0 OF:0]</text>
      
      <text x="80" y="1210" font-family="monospace" font-size="16" fill="#78716C">STUDIO TECHNICAL DRAFT // LINUS TORVALDS // REVISION 1.0</text>
    </svg>`;
    await generateSvgWebp(svg, `static/images/schematic-${i + 1}.webp`, 1000, 1300);
  }

  // 3. Project Hero Images
  const projectAssets = [
    { file: 'git-hero.webp', title: 'Git Architecture', subtitle: 'Content-Addressable Filesystem &amp; Object Store' },
    { file: 'git-dag.webp', title: 'Git Commit DAG', subtitle: 'Directed Acyclic Tree Resolution' },
    { file: 'git-pack.webp', title: 'Packfile Delta Compression', subtitle: 'Sliding Window Compression Format' },
    { file: 'vfs-hero.webp', title: 'Linux VFS Subsystem', subtitle: 'Virtual Filesystem Interface' },
    { file: 'vfs-dentry.webp', title: 'Dentry Cache Mechanics', subtitle: 'Lockless RCU Directory Lookup' },
    { file: 'vfs-inode.webp', title: 'Inode Operations Matrix', subtitle: 'POSIX Filesystem Abstraction' },
    { file: 'optics-hero.webp', title: 'Nordic Hardware &amp; Optics', subtitle: 'Documentary Prime Lens Series' },
    { file: 'optics-1.webp', title: 'Optics Plate 01', subtitle: 'Monochrome Exposure 50mm' },
    { file: 'optics-2.webp', title: 'Optics Plate 02', subtitle: 'Monochrome Exposure 35mm' },
    { file: 'optics-3.webp', title: 'Optics Plate 03', subtitle: 'Monochrome Exposure 85mm' },
    { file: 'optics-4.webp', title: 'Optics Plate 04', subtitle: 'Monochrome Exposure 28mm' },
    { file: 'schematics-hero.webp', title: 'Microprocessor Schematics', subtitle: 'Logic Flow and Pipeline Architecture' },
    { file: 'schematics-alu.webp', title: 'Arithmetic Logic Unit', subtitle: 'Carry-Lookahead Adder Circuit' },
    { file: 'schematics-cache.webp', title: 'L1/L2 Cache Hierarchy', subtitle: 'Set-Associative Mapping' },
    { file: 'bench-hero.webp', title: 'Micro-Bench Engine', subtitle: 'Nanosecond Cache Line Latency Profiler' },
    { file: 'bench-latency.webp', title: 'Latency Distribution', subtitle: 'Kernel Syscall Overhead Graph' },
  ];

  for (const p of projectAssets) {
    const svg = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="800" fill="#1C1B1A"/>
      <rect x="30" y="30" width="1140" height="740" fill="none" stroke="#3E3D3A" stroke-width="2"/>
      
      <g stroke="#2C2B29" stroke-width="1">
        <line x1="30" y1="200" x2="1170" y2="200"/>
        <line x1="30" y1="400" x2="1170" y2="400"/>
        <line x1="30" y1="600" x2="1170" y2="600"/>
        <line x1="300" y1="30" x2="300" y2="770"/>
        <line x1="600" y1="30" x2="600" y2="770"/>
        <line x1="900" y1="30" x2="900" y2="770"/>
      </g>
      
      <circle cx="600" cy="380" r="160" fill="none" stroke="#D6D3CD" stroke-width="3"/>
      <circle cx="600" cy="380" r="120" fill="none" stroke="#A8A29E" stroke-width="1" stroke-dasharray="6,6"/>
      <circle cx="600" cy="380" r="6" fill="#F4F2ED"/>
      
      <line x1="380" y1="380" x2="820" y2="380" stroke="#78716C" stroke-width="1"/>
      <line x1="600" y1="160" x2="600" y2="600" stroke="#78716C" stroke-width="1"/>
      
      <text x="600" y="660" font-family="serif" font-size="34" fill="#F4F2ED" text-anchor="middle">${p.title}</text>
      <text x="600" y="700" font-family="monospace" font-size="18" fill="#A8A29E" text-anchor="middle">${p.subtitle}</text>
      <text x="60" y="70" font-family="monospace" font-size="14" fill="#78716C">ENGINEERING ARCHIVE // LINUS TORVALDS</text>
    </svg>`;
    await generateSvgWebp(svg, `static/images/projects/${p.file}`, 1200, 800);
  }

  // 4. Blog Hero Images
  const blogAssets = [
    { file: 'taste-systems.webp', title: 'Taste in Systems &amp; Data Structures' },
    { file: 'git-two-weeks.webp', title: 'Building Git in Fourteen Days' },
    { file: 'close-to-metal.webp', title: 'Software Close to the Metal' },
    { file: 'pragmatic-engineering.webp', title: 'Pragmatic Engineering &amp; Monolithic Kernels' },
  ];

  for (const b of blogAssets) {
    const svg = `
    <svg width="1200" height="700" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#242321"/>
      <rect x="25" y="25" width="1150" height="650" fill="none" stroke="#44403C" stroke-width="2"/>
      <g stroke="#3A3835" stroke-width="1">
        <line x1="100" y1="350" x2="1100" y2="350"/>
        <line x1="600" y1="100" x2="600" y2="600"/>
      </g>
      <text x="600" y="320" font-family="serif" font-size="38" fill="#F5F5F4" text-anchor="middle">${b.title}</text>
      <text x="600" y="390" font-family="monospace" font-size="18" fill="#A8A29E" text-anchor="middle">ESSAYS ON SYSTEMS, ARCHITECTURE &amp; PRAGMATISM</text>
      <text x="60" y="60" font-family="monospace" font-size="14" fill="#78716C">LINUS TORVALDS // STUDIO ESSAY</text>
    </svg>`;
    await generateSvgWebp(svg, `static/images/blog/${b.file}`, 1200, 700);
  }

  // 5. Zine Pages (The Unix Philosophy Handbook: 6 pages)
  const zineDir = 'static/zines/unix-philosophy';
  const zinePages = [
    { num: 1, title: 'The Unix Philosophy', sub: 'A Pragmatic Systems Handbook' },
    { num: 2, title: 'Write Programs That Do One Thing', sub: 'Modular composability and clean interfaces' },
    { num: 3, title: 'Write Programs To Work Together', sub: 'Text streams and standard file descriptors' },
    { num: 4, title: 'Design For Simplicity', sub: 'Rule of Simplicity: avoid gratuitous complexity' },
    { num: 5, title: 'Make Data Structures Direct', sub: 'Rule of Representation: fold knowledge into data' },
    { num: 6, title: 'No Regressions', sub: 'Rule of Robustness: never break user space' },
  ];

  for (const page of zinePages) {
    const svg = `
    <svg width="800" height="1130" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1130" fill="#FAF9F5"/>
      <rect x="30" y="30" width="740" height="1070" fill="none" stroke="#2C2B29" stroke-width="2"/>
      <line x1="50" y1="120" x2="750" y2="120" stroke="#2C2B29" stroke-width="1"/>
      <text x="60" y="80" font-family="monospace" font-size="18" fill="#78716C">UNIX PHILOSOPHY HANDBOOK</text>
      <text x="740" y="80" font-family="monospace" font-size="18" fill="#78716C" text-anchor="end">PAGE 0${page.num}</text>
      
      <text x="400" y="460" font-family="serif" font-size="34" font-weight="bold" fill="#2C2B29" text-anchor="middle">${page.title}</text>
      <text x="400" y="520" font-family="serif" font-style="italic" font-size="20" fill="#57534E" text-anchor="middle">${page.sub}</text>
      
      <rect x="150" y="600" width="500" height="260" fill="none" stroke="#E8E6DF" stroke-width="2"/>
      <text x="180" y="660" font-family="monospace" font-size="15" fill="#78716C">stdin  ──► [ PROCESS ] ──► stdout</text>
      <text x="180" y="700" font-family="monospace" font-size="15" fill="#78716C">             │</text>
      <text x="180" y="730" font-family="monospace" font-size="15" fill="#78716C">             ▼</text>
      <text x="180" y="760" font-family="monospace" font-size="15" fill="#78716C">           stderr</text>
      <text x="180" y="810" font-family="monospace" font-size="13" fill="#A8A29E">Linear Byte Stream Composition</text>
      
      <text x="400" y="1050" font-family="monospace" font-size="14" fill="#78716C" text-anchor="middle">LINUS TORVALDS // EDITED SPECIFICATION 2026</text>
    </svg>`;
    await generateSvgWebp(svg, `${zineDir}/page-0${page.num}.webp`, 800, 1130);
  }

  // 6. Inspiration Cosmology background plate
  const cosmologySvg = `
  <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="1920" height="1080" fill="#141312"/>
    <g stroke="#2C2B29" stroke-width="1" opacity="0.6">
      ${Array.from({ length: 12 }).map((_, i) => `<circle cx="${100 + i * 160}" cy="540" r="${100 + i * 30}" fill="none"/>`).join('')}
      ${Array.from({ length: 8 }).map((_, i) => `<line x1="0" y1="${i * 150}" x2="1920" y2="${i * 150}"/>`).join('')}
      ${Array.from({ length: 12 }).map((_, i) => `<line x1="${i * 170}" y1="0" x2="${i * 170}" y2="1080"/>`).join('')}
    </g>
    <text x="960" y="540" font-family="monospace" font-size="28" fill="#44403C" text-anchor="middle" letter-spacing="12">SYSTEMS &amp; ARCHITECTURAL COSMOLOGY</text>
  </svg>`;
  await generateSvgWebp(cosmologySvg, 'static/images/inspiration_cosmology.webp', 1920, 1080);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
