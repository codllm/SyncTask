const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const oldPath = path.join(distDir, 'assets/node_modules');
const newPath = path.join(distDir, 'assets/vendor_modules');

// 1. Rename the folder if it exists
if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log('Renamed assets/node_modules to assets/vendor_modules');
} else {
  console.log('assets/node_modules folder not found or already renamed');
}

// 2. Helper function to recursively update files
function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkAndReplace(fullPath);
    } else {
      const ext = path.extname(file);
      if (['.js', '.html', '.css'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('assets/node_modules/')) {
          content = content.split('assets/node_modules/').join('assets/vendor_modules/');
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated references in: ${path.relative(distDir, fullPath)}`);
        }
      }
    }
  }
}

// 3. Start processing
walkAndReplace(distDir);
console.log('Asset patch completed successfully!');
