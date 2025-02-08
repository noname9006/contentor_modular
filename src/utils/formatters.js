/**
 * Creates a progress bar string
 * @param {number} progress - Progress value between 0 and 1
 * @returns {string} Progress bar string
 */
function createProgressBar(progress) {
    const barLength = 20;
    const filled = Math.round(barLength * progress);
    const empty = barLength - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Formats elapsed time in a human-readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatElapsedTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
}

module.exports = {
    createProgressBar,
    formatElapsedTime
};