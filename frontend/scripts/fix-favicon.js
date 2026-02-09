import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// dist/index.html is relative to the frontend directory (parent of scripts/)
// Try multiple possible paths
const possiblePaths = [
  join(__dirname, '..', 'dist', 'index.html'),  // From scripts/ to dist/
  join(process.cwd(), 'dist', 'index.html'),     // From current working directory
  join(process.cwd(), 'frontend', 'dist', 'index.html'), // If run from repo root
];

let distIndexPath = possiblePaths.find(path => {
  try {
    readFileSync(path, 'utf-8');
    return true;
  } catch {
    return false;
  }
});

if (!distIndexPath) {
  // Fallback to first path
  distIndexPath = possiblePaths[0];
  console.warn(`⚠️  dist/index.html not found in expected locations, using: ${distIndexPath}`);
}

try {
  let html = readFileSync(distIndexPath, 'utf-8');
  
  // Cache-Busting: Timestamp für Favicon
  const cacheBuster = `?v=${Date.now()}`;
  
  // Unsere Favicon-Links (müssen nach charset meta tag eingefügt werden)
  const faviconLinks = `    <!-- Favicon muss als erstes geladen werden -->
    <link rel="icon" type="image/png" href="/favicon.png${cacheBuster}" />
    <!-- Favicons für verschiedene Größen -->
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png${cacheBuster}" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png${cacheBuster}" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png${cacheBuster}" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png${cacheBuster}" />
    <!-- Fallback für Browser, die favicon.ico suchen -->
    <link rel="shortcut icon" href="/favicon.png${cacheBuster}" />`;
  
  // Entferne ALLE vorhandenen Favicon-Links (inkl. vite.svg falls vorhanden)
  html = html.replace(/<link[^>]*rel=["'](icon|shortcut icon)["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*>/gi, '');
  
  // Füge unsere Favicon-Links nach charset meta tag ein
  html = html.replace(
    /(<meta charset="[^"]*"[\s]*\/?>)/i,
    `$1${faviconLinks}`
  );
  
  writeFileSync(distIndexPath, html, 'utf-8');
  console.log(`✅ Favicon-Links in ${distIndexPath} gesetzt`);
} catch (error) {
  console.error('❌ Fehler beim Setzen der Favicon-Links:', error.message);
  console.error('   Versuchte Pfade:', possiblePaths);
  process.exit(1);
}

