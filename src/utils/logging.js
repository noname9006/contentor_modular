const fs = require('fs');
const path = require('path');
const { LOG_CONFIG } = require('../config/config');

if (!fs.existsSync(LOG_CONFIG.logDir)) {
    fs.mkdirSync(LOG_CONFIG.logDir);
}

function logMessage(type, content, elapsedTime = null) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${type}: ${JSON.stringify(content)}${elapsedTime ? ` | Elapsed Time: ${elapsedTime}` : ''}\n`;
    console.log(logMsg.trim());
    fs.appendFileSync(path.join(LOG_CONFIG.logDir, LOG_CONFIG.logFile), logMsg);
}

function checkMemoryUsage() {
    const used = process.memoryUsage();
    const memoryUsageMB = Math.round(used.heapUsed / 1024 / 1024);
    return memoryUsageMB;
}

module.exports = {
    logMessage,
    checkMemoryUsage
};