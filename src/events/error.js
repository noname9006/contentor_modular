const { Events } = require('discord.js');
const { logMessage } = require('../utils/logging');

// Discord client error handler
function handleDiscordError(client) {
    client.on(Events.Error, error => {
        console.error('Discord client error:', error);
        logMessage('DISCORD_ERROR', { 
            error: error.message, 
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });
}

// Process-level error handlers
function setupProcessErrorHandlers() {
    process.on('unhandledRejection', (error) => {
        console.error('Unhandled promise rejection:', error);
        logMessage('UNHANDLED_REJECTION', { 
            error: error.message, 
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        logMessage('UNCAUGHT_EXCEPTION', { 
            error: error.message, 
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        // Force exit on uncaught exceptions after logging
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM signal. Performing graceful shutdown...');
        logMessage('SHUTDOWN', {
            reason: 'SIGTERM',
            timestamp: new Date().toISOString()
        });
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT signal. Performing graceful shutdown...');
        logMessage('SHUTDOWN', {
            reason: 'SIGINT',
            timestamp: new Date().toISOString()
        });
        process.exit(0);
    });
}

module.exports = {
    handleDiscordError,
    setupProcessErrorHandlers
};