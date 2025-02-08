const checkCommand = require('./checkCommand');
const hashCommand = require('./hashCommand');
const checkpermsCommand = require('./checkpermsCommand');
const helpCommand = require('./helpCommand');

const commands = {
    '!check': checkCommand,
    '!hash': hashCommand,
    '!checkperms': checkpermsCommand,
    '!help': helpCommand
};

async function executeCommand(message) {
    const [commandName, ...args] = message.content.split(' ');
    const command = commands[commandName];
    
    if (!command) {
        return message.channel.send('Unknown command. Use !help to see available commands.');
    }

    try {
        await command(message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        message.channel.send(`Error executing command: ${error.message}`);
    }
}

module.exports = {
    executeCommand
};