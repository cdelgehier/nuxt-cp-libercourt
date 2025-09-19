import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const INPUT_DIR = "./public/images";
const OUTPUT_DIR = "./public/images/optimized";

// Image optimization settings
const SIZES = [400, 800, 1200, 1600]; // Responsive breakpoints
const QUALITY = 80;

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function optimizeImage(inputPath, filename) {
  const name = path.parse(filename).name;
  const ext = path.parse(filename).ext.toLowerCase();

  // Skip already optimized images and non-image files
  if (
    filename.includes("optimized") ||
    ![".jpg", ".jpeg", ".png"].includes(ext)
  ) {
    console.log(`Skipping: ${filename}`);
    return;
  }

  console.log(`Optimizing: ${filename}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Create WebP versions at different sizes
    for (const size of SIZES) {
      if (size <= metadata.width) {
        await image
          .resize(size)
          .webp({ quality: QUALITY })
          .toFile(path.join(OUTPUT_DIR, `${name}-${size}w.webp`));

        console.log(`  ✅ Created ${name}-${size}w.webp`);
      }
    }

    // Create a default WebP at original size (or max size)
    const finalSize = Math.min(metadata.width, Math.max(...SIZES));
    await image
      .resize(finalSize)
      .webp({ quality: QUALITY })
      .toFile(path.join(OUTPUT_DIR, `${name}.webp`));

    console.log(`  ✅ Created ${name}.webp (${finalSize}px)`);

    // Create fallback JPEG/PNG at reduced quality
    const format = ext === ".png" ? "png" : "jpeg";
    await image
      .resize(finalSize)
      [format]({ quality: QUALITY })
      .toFile(path.join(OUTPUT_DIR, `${name}-optimized${ext}`));

    console.log(`  ✅ Created ${name}-optimized${ext}`);
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
  }
}

async function main() {
  try {
    console.log("🖼️  Starting image optimization...");

    await ensureDir(OUTPUT_DIR);

    const files = await fs.readdir(INPUT_DIR);
    const imageFiles = files.filter((file) =>
      [".jpg", ".jpeg", ".png"].includes(path.extname(file).toLowerCase()),
    );

    console.log(`Found ${imageFiles.length} images to optimize`);

    for (const file of imageFiles) {
      await optimizeImage(path.join(INPUT_DIR, file), file);
    }

    console.log("✨ Image optimization complete!");

    // Generate stats
    const originalFiles = await Promise.all(
      imageFiles.map(async (file) => {
        const stats = await fs.stat(path.join(INPUT_DIR, file));
        return stats.size;
      }),
    );

    const optimizedFiles = await fs.readdir(OUTPUT_DIR);
    const optimizedSizes = await Promise.all(
      optimizedFiles.map(async (file) => {
        const stats = await fs.stat(path.join(OUTPUT_DIR, file));
        return stats.size;
      }),
    );

    const originalSize = originalFiles.reduce((a, b) => a + b, 0);
    const optimizedSize = optimizedSizes.reduce((a, b) => a + b, 0);
    const savings = (
      ((originalSize - optimizedSize) / originalSize) *
      100
    ).toFixed(1);

    console.log(`\n📊 Optimization Results:`);
    console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `Optimized size: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(`Savings: ${savings}%`);
  } catch (error) {
    console.error("❌ Optimization failed:", error);
    process.exit(1);
  }
}

main();
