async function helpCommand(message) {
    console.log('Help command processing started');
    const helpMessage = `
**Forum Image Analyzer Bot Commands:**
\`!check <channelId>\` - Analyze a forum channel for duplicate images
\`!checkperms <channelId>\` - Check bot permissions in a forum channel
\`!hash <channelId>\` - Build hash database for previous messages in a channel
\`!help\` - Show this help message

**Note:** All responses will be sent to the channel where the command was issued.
`;
    await message.channel.send(helpMessage);
}

module.exports = helpCommand;