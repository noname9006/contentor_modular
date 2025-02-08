// ... (previous imports remain the same)

/**
 * Processes an image and adds it to the database
 * @param {Message} message - Discord message containing the image
 * @param {MessageAttachment} attachment - The image attachment
 * @param {Map} hashDB - Hash database to update
 * @returns {Promise<boolean>} Whether the image was processed successfully
 */
async function processImage(message, attachment, hashDB) {
    // Skip if not an image or no content type
    if (!attachment.contentType?.startsWith('image/')) {
        return false;
    }

    // Skip unsupported formats without logging
    if (!isSupportedFormat(attachment.contentType)) {
        return false;
    }

    try {
        const hash = await getImageHash(attachment.url, attachment.contentType);
        if (!hashDB.has(hash)) {
            hashDB.set(hash, {
                originalMessage: {
                    id: message.id,
                    url: message.url,
                    author: {
                        username: message.author.username,
                        id: message.author.id
                    },
                    timestamp: message.createdTimestamp,
                    channelId: message.channel.id
                },
                duplicates: []
            });
        } else {
            const entry = hashDB.get(hash);
            entry.duplicates.push({
                id: message.id,
                url: message.url,
                author: {
                    username: message.author.username,
                    id: message.author.id
                },
                timestamp: message.createdTimestamp,
                channelId: message.channel.id
            });
        }
        return true;
    } catch (error) {
        // Only log errors that aren't related to unsupported formats
        if (error.code !== 'UNSUPPORTED_FORMAT') {
            console.error('Error processing image:', error);
            logMessage('IMAGE_PROCESSING_ERROR', {
                messageId: message.id,
                attachmentUrl: attachment.url,
                error: error.message
            });
        }
        return false;
    }
}

/**
 * Builds hash database for a channel
 * @param {Channel} channel - Discord channel
 * @param {Channel} commandChannel - Channel to send status updates to
 * @returns {Promise<Map>} Built hash database
 */
async function buildHashDatabaseForChannel(channel, commandChannel) {
    let hashDB = new Map();
    let lastMessageId;
    const batchSize = 100;
    let processedMessages = 0;
    let processedImages = 0;
    let skippedImages = 0;
    let startTime = Date.now();
    let statusMessage = null;

    try {
        // ... (counting messages code remains the same)

        // Process messages
        while (true) {
            const options = { limit: batchSize };
            if (lastMessageId) options.before = lastMessageId;
            
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;

            for (const msg of messages.values()) {
                processedMessages++;
                const attachments = [...msg.attachments.values()];
                
                for (const attachment of attachments) {
                    if (attachment.contentType?.startsWith('image/')) {
                        if (await processImage(msg, attachment, hashDB)) {
                            processedImages++;
                        } else {
                            skippedImages++;
                        }
                    }
                }
            }

            // Update progress
            if (processedMessages % 100 === 0 || processedMessages === totalMessages) {
                const progress = (processedMessages / totalMessages);
                const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                const progressBar = createProgressBar(progress);
                
                const statusText = 
                    `Building hash database...\n` +
                    `${progressBar}\n` +
                    `Progress: ${(progress * 100).toFixed(2)}% (${processedMessages.toLocaleString()}/${totalMessages.toLocaleString()} messages)\n` +
                    `Images processed: ${processedImages.toLocaleString()}\n` +
                    `Images skipped: ${skippedImages.toLocaleString()}\n` +
                    `Unique images: ${hashDB.size.toLocaleString()}\n` +
                    `Time elapsed: ${formatElapsedTime(elapsedTime)}`;

                await statusMessage.edit(statusText);
            }
            
            lastMessageId = messages.last().id;
            messages.clear();
            if (global.gc) global.gc();
        }

        // Final status update
        const finalStatus = 
            `Hash database build complete!\n` +
            `Total messages processed: ${processedMessages.toLocaleString()}\n` +
            `Total images processed: ${processedImages.toLocaleString()}\n` +
            `Images skipped: ${skippedImages.toLocaleString()}\n` +
            `Unique images: ${hashDB.size.toLocaleString()}\n` +
            `Time taken: ${formatElapsedTime(Math.floor((Date.now() - startTime) / 1000))}`;

        await statusMessage.edit(finalStatus);
        return hashDB;

    } catch (error) {
        console.error('Error in buildHashDatabaseForChannel:', error);
        const errorMessage = `Error building hash database: ${error.message}`;
        if (statusMessage) {
            await statusMessage.edit(errorMessage);
        } else {
            await commandChannel.send(errorMessage);
        }
        throw error;
    }
}

// ... (rest of the code remains the same)