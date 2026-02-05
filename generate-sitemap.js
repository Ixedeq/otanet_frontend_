/**
 * Dynamic Sitemap Generator
 * Run this script to generate sitemap-manga.xml from your manga database
 * Usage: node generate-sitemap.js
 * 
 * Requirements:
 * - Flask API must be running on localhost:5001
 * - Script will fetch all manga from /api/all-manga endpoint
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';

async function generateMangaSitemap() {
  try {
    console.log(`📡 Fetching manga data from ${API_BASE_URL}/api/all-manga...`);
    
    const response = await fetch(`${API_BASE_URL}/api/all-manga`);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const mangaList = await response.json();
    
    if (!Array.isArray(mangaList)) {
      throw new Error('API did not return an array of manga');
    }
    
    console.log(`✓ Retrieved ${mangaList.length} manga entries`);

    let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add each manga page
    mangaList.forEach((manga, index) => {
      const mangaUrl = `https://ota-network.com/${manga.slug}/${manga.hash}`;
      sitemapXml += `  <url>\n`;
      sitemapXml += `    <loc>${mangaUrl}</loc>\n`;
      sitemapXml += `    <changefreq>weekly</changefreq>\n`;
      sitemapXml += `    <priority>0.8</priority>\n`;
      sitemapXml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      sitemapXml += `  </url>\n`;
      
      if ((index + 1) % 100 === 0) {
        console.log(`  → Processed ${index + 1} manga...`);
      }
    });

    sitemapXml += '</urlset>';

    // Write to public folder
    const sitemapPath = path.join(__dirname, 'public', 'sitemap-manga.xml');
    fs.writeFileSync(sitemapPath, sitemapXml);
    
    console.log(`\n✅ Sitemap generated successfully!`);
    console.log(`📁 Location: ${sitemapPath}`);
    console.log(`📊 Total URLs: ${mangaList.length}`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Verify the sitemap: ${sitemapPath}`);
    console.log(`2. Upload to your web server`);
    console.log(`3. Submit to Google Search Console: https://search.google.com/search-console`);
    console.log(`4. Submit to Bing Webmaster: https://www.bing.com/webmasters`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:');
    console.error(`   ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.error(`   - Is Flask API running? (${API_BASE_URL})`);
    console.error(`   - Try: python3 src/api/flask_api.py`);
    console.error(`   - Or set API_URL: API_URL=http://your-server:5001 node generate-sitemap.js`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateMangaSitemap();
}

module.exports = { generateMangaSitemap };
