const { Events } = require('discord.js');
const { TRACKED_CHANNELS } = require('../config/config');
const { isSupportedImage, getImageHash } = require('../services/imageProcessing');
const { channelHashTables, loadHashDatabase, saveHashDatabase } = require('../services/databaseService');
const { executeCommand } = require('../commands');

async function handleMessageCreate(message) {
    if (message.author.bot) return;

    // Handle commands
    if (message.content.startsWith('!')) {
        return executeCommand(message);
    }

    // Handle regular messages with images in tracked channels
    if (TRACKED_CHANNELS.includes(message.channel.id)) {
        const attachments = [...message.attachments.values()];
        const containsImage = attachments.some(att => att.contentType?.startsWith('image/'));
        
        if (!containsImage) return;

        let hashDB = channelHashTables[message.channel.id] || loadHashDatabase(message.channel.id);

        for (const attachment of attachments) {
            if (!isSupportedImage(attachment)) continue;

            try {
                const hash = await getImageHash(attachment.url);
                // Process image hash and update database...
                // (Previous image processing logic here)
            } catch (err) {
                console.error('Error processing image:', err);
            }
        }

        saveHashDatabase(message.channel.id, hashDB);
        channelHashTables[message.channel.id] = hashDB;
    }
}

module.exports = handleMessageCreate;