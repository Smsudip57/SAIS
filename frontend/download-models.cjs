#!/usr/bin/env node

/**
 * Download face-api models from CDN and save to public/models/
 * This script ensures all required face recognition models are available
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, 'public', 'models');
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';

// Clean existing models directory
if (fs.existsSync(MODELS_DIR)) {
    console.log('🧹 Cleaning existing models directory...');
    fs.readdirSync(MODELS_DIR).forEach(file => {
        fs.unlinkSync(path.join(MODELS_DIR, file));
    });
} else {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`✅ Created models directory: ${MODELS_DIR}`);
}

// List of all required model files
const modelFiles = [
    // Tiny Face Detector (for face detection)
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model.bin',

    // Face Landmark Detection (68 facial points)
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.bin',

    // Face Recognition (128-dimensional face descriptor)
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.bin',
];

let completedCount = 0;
let failedCount = 0;

function downloadFile(filename) {
    return new Promise((resolve) => {
        const fileUrl = CDN_URL + filename;
        const filePath = path.join(MODELS_DIR, filename);
        const file = fs.createWriteStream(filePath);

        https
            .get(fileUrl, (response) => {
                if (response.statusCode !== 200) {
                    console.error(`❌ Error downloading ${filename}: HTTP ${response.statusCode}`);
                    fs.unlink(filePath, () => { });
                    failedCount++;
                    resolve();
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    const stats = fs.statSync(filePath);
                    const sizeKB = (stats.size / 1024).toFixed(2);
                    console.log(`✅ Downloaded: ${filename} (${sizeKB} KB)`);
                    completedCount++;
                    resolve();
                });
            })
            .on('error', (err) => {
                console.error(`❌ Error downloading ${filename}: ${err.message}`);
                fs.unlink(filePath, () => { });
                failedCount++;
                resolve();
            });
    });
}

async function downloadAllModels() {
    console.log('🔄 Starting face-api models download...\n');
    console.log(`📦 CDN: ${CDN_URL}`);
    console.log(`📁 Destination: ${MODELS_DIR}`);
    console.log(`📊 Files to download: ${modelFiles.length}\n`);

    for (const file of modelFiles) {
        await downloadFile(file);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Completed: ${completedCount}/${modelFiles.length}`);
    if (failedCount > 0) {
        console.log(`❌ Failed: ${failedCount}/${modelFiles.length}`);
        console.log('\n⚠️  Some models failed to download.');
    } else {
        console.log('🎉 All face-api models downloaded successfully!');
    }
    console.log('='.repeat(60) + '\n');

    process.exit(failedCount > 0 ? 1 : 0);
}

downloadAllModels();
