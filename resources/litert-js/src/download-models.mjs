import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import DownloadCache from '../../shared/download-cache.mjs';

// --- Configuration ---
const MODEL_DIR = './models';
const CACHE_VERSION = 2;

const MODELS_TO_DOWNLOAD = [
    {
        key: 'mediapipe_selfie',
        url: 'https://huggingface.co/webnn/mediapipe_selfie/resolve/main/tflite/mediapipe_selfie.tflite',
        outputPath: 'mediapipe_selfie.tflite',
    },
    {
        key: 'mobilenet_v3_small',
        url: 'https://huggingface.co/webnn/mobilenet_v3_small/resolve/main/tflite/mobilenet_v3_small.tflite',
        outputPath: 'mobilenet_v3_small.tflite',
    },
    {
        key: 'mobilenet_v3_small_labels',
        url: 'https://huggingface.co/webnn/mobilenet_v3_small/resolve/main/tflite/labels.txt',
        outputPath: 'labels.txt',
    },
    {
        key: 'mediapipe_hand_detector',
        url: 'https://huggingface.co/webnn/mediapipe_hand/resolve/main/tflite/HandDetector.tflite',
        outputPath: 'HandDetector.tflite',
    },
    {
        key: 'mediapipe_hand_landmark',
        url: 'https://huggingface.co/webnn/mediapipe_hand/resolve/main/tflite/HandLandmarkDetector.tflite',
        outputPath: 'HandLandmarkDetector.tflite',
    },
];

async function downloadFile(url, destPath) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText} (${response.status})`);
    }
    const fileStream = fs.createWriteStream(destPath);
    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
    });
}

async function downloadModels() {
    const CACHE_FILE = path.join(MODEL_DIR, 'cache.json');
    const cache = new DownloadCache(CACHE_FILE, CACHE_VERSION, process.argv.includes('--force'));

    if (!fs.existsSync(MODEL_DIR)) {
        console.log(`Creating directory: ${MODEL_DIR}`);
        fs.mkdirSync(MODEL_DIR, { recursive: true });
    }

    console.log(`Starting TFLite model downloads from Hugging Face to: ${MODEL_DIR}`);

    for (const { key, url, outputPath } of MODELS_TO_DOWNLOAD) {
        if (cache.has(key)) {
            console.log(`${outputPath} already cached. Skipping.`);
            continue;
        }

        const dest = path.join(MODEL_DIR, outputPath);
        console.log(`\nDownloading ${outputPath}...`);
        console.log(`  URL: ${url}`);

        try {
            await downloadFile(url, dest);
            console.log(`  Saved to ${dest}`);
            cache.put(key);
        } catch (err) {
            console.error(`  Failed to download ${outputPath}:`, err.message);
        }
    }

    console.log('\nTFLite download process finished.');
}

downloadModels().catch(err => {
    console.error("Download process terminated unexpectedly:", err);
    process.exit(1);
});

