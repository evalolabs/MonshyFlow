import { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export function preserveFavicon(): Plugin {
  return {
    name: 'preserve-favicon',
    generateBundle() {
      // This runs after all files are generated
    },
    writeBundle(options, bundle) {
      // This runs after the bundle is written to disk
      const outDir = options.dir || 'dist';
      const indexPath = join(outDir, 'index.html');
      
      try {
        let html = readFileSync(indexPath, 'utf-8');
        
        // Get favicon path from environment variable or use default
        const faviconPath = process.env.VITE_FAVICON_PATH || '/favicon.png';
        const cacheBuster = `?v=${Date.now()}`;
        
        // Favicon-Links (configurable via VITE_FAVICON_PATH)
        const faviconLinks = `    <!-- Favicon muss als erstes geladen werden -->
    <link rel="icon" type="image/png" href="${faviconPath}${cacheBuster}" />
    <!-- Favicons für verschiedene Größen -->
    <link rel="icon" type="image/png" sizes="16x16" href="${faviconPath}${cacheBuster}" />
    <link rel="icon" type="image/png" sizes="32x32" href="${faviconPath}${cacheBuster}" />
    <link rel="icon" type="image/png" sizes="192x192" href="${faviconPath}${cacheBuster}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${faviconPath}${cacheBuster}" />
    <!-- Fallback für Browser, die favicon.ico suchen -->
    <link rel="shortcut icon" href="${faviconPath}${cacheBuster}" />`;
        
        // Entferne ALLE vorhandenen Favicon-Links
        html = html.replace(/<link[^>]*rel=["'](icon|shortcut icon)["'][^>]*>/gi, '');
        html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*>/gi, '');
        
        // Füge unsere Favicon-Links nach charset meta tag ein
        html = html.replace(
          /(<meta charset="[^"]*"[\s]*\/?>)/i,
          `$1${faviconLinks}`
        );
        
        writeFileSync(indexPath, html, 'utf-8');
        console.log('✅ Favicon-Links in dist/index.html wiederhergestellt (via Vite Plugin)');
      } catch (error: any) {
        console.error('❌ Fehler beim Wiederherstellen der Favicon-Links:', error.message);
      }
    },
  };
}

