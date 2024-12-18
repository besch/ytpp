const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "../build/manifest.json");

// Check if build directory exists, if not create it
const buildDir = path.join(__dirname, "../build");
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Check if manifest exists in build directory
if (!fs.existsSync(manifestPath)) {
  // Copy from public directory if it doesn't exist in build
  const sourceManifestPath = path.join(__dirname, "../public/manifest.json");
  if (fs.existsSync(sourceManifestPath)) {
    fs.copyFileSync(sourceManifestPath, manifestPath);
  } else {
    console.error("Error: manifest.json not found in public directory");
    process.exit(1);
  }
}

try {
  // Read and parse the manifest
  const manifestContent = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent);

  // Update paths in the manifest
  manifest.background.service_worker = "background.js";

  // Write the updated manifest back to the build directory
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("Manifest file updated successfully.");
} catch (error) {
  console.error("Error updating manifest:", error);
  process.exit(1);
}
