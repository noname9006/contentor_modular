async function checkpermsCommand(message, args) {
    console.log('Checkperms command processing started');
    const channelId = args[0];
    
    if (!channelId) {
        console.log('Checkperms command failed: No channel ID provided');
        return message.channel.send('Please provide a channel ID. Usage: !checkperms <channelId>');
    }

    try {
        const channel = await message.client.channels.fetch(channelId);
        if (!channel) {
            return message.channel.send('Channel not found');
        }
        
        const permissions = channel.permissionsFor(message.client.user);
        const permissionList = ['ViewChannel', 'ReadMessageHistory', 'SendMessages'];
        const permissionStatus = permissionList.map(perm => 
            `${perm}: ${permissions.has(perm) ? '✅' : '❌'}`
        ).join('\n');
        
        message.channel.send(`Bot permissions in channel:\n${permissionStatus}`);
    } catch (error) {
        console.error('Checkperms command error:', error);
        message.channel.send(`Error checking permissions: ${error.message}`);
    }
}

module.exports = checkpermsCommand;