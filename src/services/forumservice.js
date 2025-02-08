const { logMessage } = require('../utils/logging');
const { checkChannelPermissions } = require('../utils/permissions');

/**
 * Gets all forum posts from a channel
 * @param {Channel} channel - Discord forum channel
 * @returns {Promise<{active: Array, archived: Array}>} Object containing active and archived posts
 */
async function getAllForumPosts(channel) {
    console.log(`Fetching forum posts for channel ${channel.id}`);
    if (channel.type !== 15) {
        console.error('Invalid channel type for forum posts');
        throw new Error('This is not a forum channel');
    }
    
    try {
        console.log('Fetching active posts...');
        const activePosts = await channel.threads.fetchActive();
        console.log(`Found ${activePosts.threads.size} active posts`);

        console.log('Fetching archived posts...');
        const archivedPosts = await channel.threads.fetchArchived();
        console.log(`Found ${archivedPosts.threads.size} archived posts`);

        return {
            active: Array.from(activePosts.threads.values()),
            archived: Array.from(archivedPosts.threads.values())
        };
    } catch (error) {
        console.error('Error fetching forum posts:', error);
        throw new Error(`Failed to fetch forum posts: ${error.message}`);
    }
}

/**
 * Counts total messages in a channel
 * @param {Channel} channel - Discord channel
 * @returns {Promise<number>} Total number of messages
 */
async function countTotalMessages(channel) {
    console.log(`Counting messages in channel ${channel.id}`);
    await checkChannelPermissions(channel);
    let totalMessages = 0;
    let lastMessageId;
    const batchSize = 100;
    
    try {
        while (true) {
            const options = { limit: batchSize };
            if (lastMessageId) options.before = lastMessageId;
            const messages = await channel.messages.fetch(options);
            if (!messages || messages.size === 0) break;
            totalMessages += messages.size;
            lastMessageId = messages.last()?.id;
            messages.clear();
            if (global.gc) global.gc();
            
            if (totalMessages % 1000 === 0) {
                console.log(`Counted ${totalMessages} messages so far...`);
            }
        }
        console.log(`Finished counting messages. Total: ${totalMessages}`);
        return totalMessages;
    } catch (error) {
        console.error('Error counting messages:', error);
        throw new Error(`Failed to count messages: ${error.message}`);
    }
}

/**
 * Process messages in a channel or thread for duplicate images
 * @param {Channel} channel - Discord channel or thread
 * @param {Map} imageDatabase - Database of image hashes
 * @param {string} context - Context identifier for the processing
 * @returns {Promise<{processedImages: number, duplicatesFound: number}>}
 */
async function processMessages(channel, imageDatabase, context = '') {
    console.log(`Processing messages in ${context || channel.id}`);
    await checkChannelPermissions(channel);
    let processedImages = 0;
    let duplicatesFound = 0;
    let lastMessageId;
    const batchSize = 100;
    let processedMessages = 0;

    while (true) {
        const options = { limit: batchSize };
        if (lastMessageId) options.before = lastMessageId;
        
        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;

        for (const msg of messages.values()) {
            const attachments = [...msg.attachments.values()];
            for (const attachment of attachments) {
                if (!attachment.contentType?.startsWith('image/')) continue;

                processedImages++;
                try {
                    const hash = await getImageHash(attachment.url);
                    if (imageDatabase.has(hash)) {
                        duplicatesFound++;
                        // Update duplicate information in database
                        const entry = imageDatabase.get(hash);
                        entry.duplicates.push({
                            id: msg.id,
                            url: msg.url,
                            author: {
                                username: msg.author.username,
                                id: msg.author.id
                            },
                            timestamp: msg.createdTimestamp,
                            location: context
                        });
                    } else {
                        // Add new image to database
                        imageDatabase.set(hash, {
                            originalMessage: {
                                id: msg.id,
                                url: msg.url,
                                author: {
                                    username: msg.author.username,
                                    id: msg.author.id
                                },
                                timestamp: msg.createdTimestamp,
                                location: context
                            },
                            duplicates: []
                        });
                    }
                } catch (error) {
                    console.error('Error processing image:', error);
                    logMessage('IMAGE_ERROR', {
                        messageId: msg.id,
                        attachmentUrl: attachment.url,
                        error: error.message
                    });
                }
            }
        }
        
        lastMessageId = messages.last().id;
        messages.clear();
        if (global.gc) global.gc();
    }

    return { processedImages, duplicatesFound };
}

module.exports = {
    getAllForumPosts,
    countTotalMessages,
    processMessages
};