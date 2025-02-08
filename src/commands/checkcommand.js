const { logMessage } = require('../utils/logging');
const { formatElapsedTime, createProgressBar } = require('../utils/formatters');
const { getAllForumPosts, countTotalMessages, processMessages } = require('../services/forumService');
const { generateReport } = require('../services/reportService');

async function checkCommand(message, args) {
    console.log('Check command processing started');
    const commandStartTime = Date.now();
    let statusMessage = null;
    
    const channelId = args[0];
    if (!channelId) {
        console.log('Check command failed: No channel ID provided');
        return message.channel.send('Please provide a forum channel ID. Usage: !check <channelId>');
    }
    
    try {
        if (!channelId.match(/^\d+$/)) {
            console.error('Invalid channel ID format');
            return message.channel.send('Invalid channel ID format');
        }

        const channel = await message.client.channels.fetch(channelId);
        if (!channel) throw new Error('Channel not found');
        if (channel.type !== 15) throw new Error('This channel is not a forum channel');

        statusMessage = await message.channel.send('Starting forum analysis... This might take a while.');
        
        const { active: activePosts, archived: archivedPosts } = await getAllForumPosts(channel);
        const allPosts = [...activePosts, ...archivedPosts];
        
        let totalMessages = 0;
        for (const post of allPosts) {
            totalMessages += await countTotalMessages(post);
        }

        await statusMessage.edit(
            `Starting analysis of ${totalMessages.toLocaleString()} total messages across ${allPosts.length} forum posts...`
        );

        const imageDatabase = new Map();
        if (global.gc) {
            global.gc();
        }

        let processedImages = 0;
        let duplicatesFound = 0;
        let startTime = Date.now();

        for (const post of allPosts) {
            const postResults = await processMessages(post, imageDatabase, `forum-post-${post.name}`);
            processedImages += postResults.processedImages;
            duplicatesFound += postResults.duplicatesFound;
            
            const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
            const progressBar = createProgressBar((allPosts.indexOf(post) + 1) / allPosts.length);
            
            const statusUpdate = 
                `Processing forum posts...\n` +
                `${progressBar}\n` +
                `Found ${processedImages.toLocaleString()} images (${duplicatesFound.toLocaleString()} duplicates)\n` +
                `Time elapsed: ${elapsedMinutes} minutes\n` +
                `Currently processing: ${post.name}`;

            await statusMessage.edit(statusUpdate);
        }

        const reportFile = await generateReport(channelId, imageDatabase);
        const elapsedTime = formatElapsedTime((Date.now() - commandStartTime) / 1000);

        const finalMessage = {
            content: `Analysis complete!\n` +
                    `Total messages analyzed: ${totalMessages.toLocaleString()}\n` +
                    `Images found: ${processedImages.toLocaleString()}\n` +
                    `Duplicates found: ${duplicatesFound.toLocaleString()}\n` +
                    `Forum posts analyzed: ${allPosts.length}\n` +
                    `Time taken: ${elapsedTime}\n` +
                    `Report saved as: ${reportFile}`,
            files: [reportFile]
        };

        await statusMessage.edit(finalMessage);

    } catch (error) {
        console.error('Error in checkCommand:', error);
        const errorMessage = `An error occurred: ${error.message}`;
        if (statusMessage) {
            await statusMessage.edit(errorMessage);
        } else {
            await message.channel.send(errorMessage);
        }
    }
}

module.exports = checkCommand;