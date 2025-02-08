const { imageHash } = require('image-hash');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { pipeline } = require('stream');
const { logMessage } = require('../utils/logging');

const imageHashAsync = promisify(imageHash);
const pipelineAsync = promisify(pipeline);
const unlinkAsync = promisify(fs.unlink);

// Supported image formats
const SUPPORTED_FORMATS = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
]);

/**
 * Checks if the content type is a supported image format
 * @param {string} contentType - MIME type of the image
 * @returns {boolean} Whether the format is supported
 */
function isSupportedFormat(contentType) {
    return SUPPORTED_FORMATS.has(contentType);
}

/**
 * Gets the hash of an image from a URL
 * @param {string} url - The URL of the image
 * @param {string} contentType - The content type of the image
 * @returns {Promise<string>} The hash of the image
 * @throws {UnsupportedFormatError} If the image format is not supported
 */
async function getImageHash(url, contentType) {
    // Early check for unsupported formats
    if (!isSupportedFormat(contentType)) {
        const error = new Error(`Unsupported image format: ${contentType}`);
        error.code = 'UNSUPPORTED_FORMAT';
        throw error;
    }

    const tmpdir = os.tmpdir();
    const tmpfile = path.join(tmpdir, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    
    try {
        // Download the image
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(tmpfile);
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                    return;
                }

                pipeline(response, file, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }).on('error', reject);
        });

        // Generate hash
        const hash = await imageHashAsync(tmpfile, 16, true);
        return hash;

    } finally {
        // Clean up temporary file
        try {
            await unlinkAsync(tmpfile);
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

module.exports = {
    getImageHash,
    isSupportedFormat,
    SUPPORTED_FORMATS
};