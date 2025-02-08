require('dotenv').config();

// Add environment variable validation
if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN is required in environment variables');
}

const BOT_INFO = {
    startTime: new Date().toISOString().replace('T', ' ').split('.')[0],
    memoryLimit: 800, // MB
    version: require('../../package.json').version // Add version tracking
};

const LOG_CONFIG = {
    logDir: 'logs',
    logFile: `bot_log_${new Date().toISOString().split('T')[0]}.log`,
    maxLogFiles: 30, // Add log rotation configuration
    logLevel: process.env.LOG_LEVEL || 'info' // Add configurable log levels
};

// Add Discord-specific configurations
const DISCORD_CONFIG = {
    prefix: process.env.COMMAND_PREFIX || '!',
    presence: {
        status: 'online',
        activity: {
            type: 'WATCHING',
            name: 'for duplicate images'
        }
    },
    cooldown: 3000, // milliseconds between commands
};

// Add permissions configuration
const PERMISSION_CONFIG = {
    adminRoles: (process.env.ADMIN_ROLES || '').split(',').filter(Boolean),
    moderatorRoles: (process.env.MODERATOR_ROLES || '').split(',').filter(Boolean),
    requiredPermissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
};

const LOG_EVENTS = {
    HASH_COMMAND: 'HASH_COMMAND_RECEIVED',
    HASH_START: 'HASH_CREATION_START',
    HASH_PROGRESS: 'HASH_CREATION_PROGRESS',
    HASH_FINISH: 'HASH_CREATION_FINISH',
    HASH_EXPORT: 'HASH_EXPORT',
    NEW_IMAGE: 'NEW_IMAGE_DETECTED',
    NEW_HASH: 'NEW_HASH_CREATED',
    HASH_COMPARED: 'HASH_COMPARED',
    DUPLICATE_FOUND: 'DUPLICATE_FOUND',
    IMAGE_ERROR: 'IMAGE_PROCESSING_ERROR',
    VALIDATION_ERROR: 'IMAGE_VALIDATION_ERROR',
    BOT_STATUS: 'BOT_STATUS_UPDATE',
    DEBUG: 'DEBUG_INFO',
    BOT_ERROR: 'BOT_ERROR', // Add general error event
    PERMISSION_ERROR: 'PERMISSION_ERROR' // Add permission-related error event
};

// Add image processing configuration
const IMAGE_CONFIG = {
    maxSize: 8 * 1024 * 1024, // 8MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    hashAlgorithm: 'average', // or 'perceptual', 'difference'
    similarityThreshold: 0.95
};

const TRACKED_CHANNELS = process.env.TRACKED_CHANNELS 
    ? process.env.TRACKED_CHANNELS.split(',').map(channelId => channelId.trim())
    : [];

module.exports = {
    BOT_INFO,
    LOG_CONFIG,
    LOG_EVENTS,
    TRACKED_CHANNELS,
    DISCORD_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_CONFIG,
    PERMISSION_CONFIG,
    IMAGE_CONFIG
};