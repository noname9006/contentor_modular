const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const { logMessage } = require('./utils/logging'); 
const { handleMessage } = require('./events/messageCreate');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction
    ]
});

// Bot required permissions
const REQUIRED_PERMISSIONS = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.EmbedLinks
];

// Event: Bot is ready
client.once('ready', () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    logMessage('BOT_LOGIN_SUCCESS', {
        username: client.user.tag,
        startTime: new Date().toISOString()
    });
});

// Event: Message received
client.on('messageCreate', async (message) => {
    try {
        // Ignore messages from bots
        if (message.author.bot) return;

        // Check if bot has permissions in the channel
        if (message.guild) {
            const permissions = message.channel.permissionsFor(client.user);
            if (!permissions.has(REQUIRED_PERMISSIONS)) {
                // Try to send DM to user about missing permissions
                try {
                    await message.author.send(
                        `I don't have the required permissions in ${message.channel.name}.\n` +
                        `Please make sure I have the following permissions:\n` +
                        `- View Channel\n` +
                        `- Send Messages\n` +
                        `- Read Message History\n` +
                        `- Attach Files\n` +
                        `- Embed Links`
                    );
                } catch (dmError) {
                    console.error('Could not send DM to user about permissions');
                }
                return;
            }
        }

        await handleMessage(message);
    } catch (error) {
        console.error('Discord client error:', error);
        logMessage('DISCORD_ERROR', {
            error: error.message,
            stack: error.stack
        });
    }
});

// Event: Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
    logMessage('DISCORD_ERROR', {
        error: error.message,
        stack: error.stack
    });
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);