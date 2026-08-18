const fs = require('fs');
const path = require('path');
const { minify: terserMinify } = require('terser');
const CleanCSS = require('clean-css');
const sharp = require('sharp');

// Configuration
const CONFIG = {
  js: {
    input: 'script.js',
    output: 'script.min.js'
  },
  css: {
    input: 'style.css',
    output: 'style.min.css'
  },
  images: {
    inputDir: 'images',
    outputDir: path.join('assets', 'images'),
    quality: 80 // WebP compression quality (0-100)
  }
};

// 1. Minify JavaScript
async function buildJS() {
  console.log('⚡ Minifying JS...');
  if (!fs.existsSync(CONFIG.js.input)) {
    console.warn(`⚠️  Skipped JS: ${CONFIG.js.input} not found.`);
    return;
  }

  const jsCode = fs.readFileSync(CONFIG.js.input, 'utf8');
  try {
    const result = await terserMinify(jsCode, {
      compress: true,
      mangle: true
    });
    fs.writeFileSync(CONFIG.js.output, result.code);
    console.log(`✅ JS minified: ${CONFIG.js.output}`);
  } catch (err) {
    console.error('❌ Error minifying JS:', err);
  }
}

// 2. Minify CSS
function buildCSS() {
  console.log('⚡ Minifying CSS...');
  if (!fs.existsSync(CONFIG.css.input)) {
    console.warn(`⚠️  Skipped CSS: ${CONFIG.css.input} not found.`);
    return;
  }

  const cssCode = fs.readFileSync(CONFIG.css.input, 'utf8');
  try {
    const output = new CleanCSS({ level: 2 }).minify(cssCode);
    if (output.errors.length) {
      console.error('❌ CSS Errors:', output.errors);
      return;
    }
    fs.writeFileSync(CONFIG.css.output, output.styles);
    console.log(`✅ CSS minified: ${CONFIG.css.output}`);
  } catch (err) {
    console.error('❌ Error minifying CSS:', err);
  }
}

// 3. Compress & Convert Images
async function buildImages() {
  console.log('⚡ Compressing Images...');
  if (!fs.existsSync(CONFIG.images.inputDir)) {
    console.warn(`⚠️  Skipped Images: ${CONFIG.images.inputDir} folder not found.`);
    return;
  }

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.images.outputDir)) {
    fs.mkdirSync(CONFIG.images.outputDir, { recursive: true });
  }

  const files = fs.readdirSync(CONFIG.images.inputDir);
  const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff']);

  let count = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.has(ext)) {
      const inputPath = path.join(CONFIG.images.inputDir, file);
      
      // Output as optimized webp
      const fileNameWithoutExt = path.basename(file, ext);
      const outputPath = path.join(CONFIG.images.outputDir, `${fileNameWithoutExt}.webp`);

      try {
        await sharp(inputPath)
          .webp({ quality: CONFIG.images.quality })
          .toFile(outputPath);
        count++;
      } catch (err) {
        console.error(`❌ Failed to compress ${file}:`, err.message);
      }
    }
  }

  console.log(`✅ Optimized ${count} images into -> ${CONFIG.images.outputDir}`);
}

// Run All Tasks
async function run() {
  console.log('🚀 Starting Build Process...\n');
  await buildJS();
  buildCSS();
  await buildImages();
  console.log('\n🎉 Build completed successfully!');
}

run();