const { logMessage } = require('../utils/logging');
const { PermissionUtil } = require('../utils/permissions');
const { buildHashDatabaseForChannel, saveHashDatabase, channelHashTables } = require('../services/databaseService');
const { LOG_EVENTS } = require('../config/config');

async function hashCommand(message, args) {
    console.log('Hash command processing started');
    const channelId = args[0];
    
    if (!channelId) {
        console.log('Hash command failed: No channel ID provided');
        return message.channel.send('Please provide a channel ID. Usage: !hash <channel_id>');
    }

    try {
        console.log(`Fetching channel ${channelId}`);
        const targetChannel = await message.client.channels.fetch(channelId);
        if (!targetChannel) {
            console.log('Hash command failed: Channel not found');
            return message.channel.send('Channel not found');
        }
        
        await PermissionUtil.checkChannelPermissions(targetChannel);
        logMessage(LOG_EVENTS.HASH_START, { 
            targetChannelId: channelId,
            commandChannelId: message.channel.id 
        });
        
        const hashDB = await buildHashDatabaseForChannel(targetChannel, message.channel);
        saveHashDatabase(channelId, hashDB);
        channelHashTables[channelId] = hashDB;
        
    } catch (error) {
        console.error('Hash command error:', error);
        logMessage('ERROR', { error: error.message, channelId });
        message.channel.send(`Error: ${error.message}`);
    }
}

module.exports = hashCommand;