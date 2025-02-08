const fs = require('fs');
const { formatElapsedTime, getCurrentFormattedTime } = require('../utils/formatters');
const { logMessage } = require('../utils/logging');
const { BOT_INFO } = require('../config/config');

/**
 * Generates a statistical report about duplicate images for a specific channel
 * @param {string} channelId - The ID of the channel being analyzed
 * @param {Map} imageDatabase - The database containing image hashes and their occurrences
 * @returns {Promise<string>} The filename of the generated report
 */
async function generateReport(channelId, imageDatabase) {
    console.log(`Generating report for channel ${channelId}`);
    const fileName = `duplicate_report_${channelId}_${Date.now()}.csv`;
    const writeStream = fs.createWriteStream(fileName);
    
    // Write report header
    writeStream.write(
        `# Forum Analysis Report\n` +
        `# Channel ID: ${channelId}\n` +
        `# Analysis performed at: ${getCurrentFormattedTime()} UTC\n` +
        `# Total unique images analyzed: ${imageDatabase.size}\n\n` +
        'Original Post URL,Original Poster,Original Location,Upload Date,Number of Duplicates,Users Who Reposted,Locations of Reposts,Stolen Reposts,Self-Reposts\n'
    );

    let processedEntries = 0;
    console.log(`Processing ${imageDatabase.size} entries for report`);

    try {
        for (const [hash, imageInfo] of imageDatabase.entries()) {
            const allPosters = [imageInfo.originalMessage, ...imageInfo.duplicates];
            allPosters.sort((a, b) => a.timestamp - b.timestamp);
            const originalPoster = allPosters[0];
            const reposts = allPosters.slice(1);
            
            let stolenCount = 0;
            let selfRepostCount = 0;
            
            for (const repost of reposts) {
                if (repost.author.id === originalPoster.author.id) {
                    selfRepostCount++;
                } else {
                    stolenCount++;
                }
            }

            const uploadDate = new Date(originalPoster.timestamp).toISOString().split('T')[0];
            const line = [
                originalPoster.url,
                originalPoster.author.username,
                originalPoster.location || originalPoster.channelId,
                uploadDate,
                reposts.length,
                reposts.map(d => d.author.username).join(';'),
                reposts.map(d => d.location || d.channelId).join(';'),
                stolenCount,
                selfRepostCount
            ].join(',') + '\n';
            
            writeStream.write(line);
            
            processedEntries++;
            if (processedEntries % 100 === 0) {
                console.log(`Report progress: ${processedEntries}/${imageDatabase.size} entries processed`);
            }
        }

        await new Promise(resolve => writeStream.end(resolve));
        console.log(`Report generated successfully: ${fileName}`);
        
        // Log report generation
        logMessage('REPORT_GENERATED', {
            channelId,
            fileName,
            totalEntries: imageDatabase.size,
            timestamp: getCurrentFormattedTime()
        });

        return fileName;

    } catch (error) {
        console.error('Error generating report:', error);
        logMessage('REPORT_ERROR', {
            channelId,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to generate report: ${error.message}`);
    }
}

/**
 * Generates a report focused on user statistics and repost behavior
 * @param {string} channelId - The ID of the channel being analyzed
 * @param {Map} authorStats - Map containing statistics per author
 * @returns {Promise<string>} The filename of the generated author report
 */
async function generateAuthorReport(channelId, authorStats) {
    console.log(`Generating author report for channel ${channelId}`);
    const fileName = `author_report_${channelId}_${Date.now()}.csv`;
    
    try {
        const headers = [
            'Username',
            'Total Reposts',
            'Self Reposts',
            'Stolen Reposts',
            'Times Been Reposted',
            'Repost Ratio',
            'First Activity',
            'Last Activity'
        ].join(',') + '\n';
        
        const lines = [];
        for (const [authorId, stats] of authorStats.entries()) {
            const repostRatio = stats.totalReposts > 0 
                ? (stats.stolenReposts / stats.totalReposts).toFixed(2) 
                : '0.00';
                
            lines.push([
                stats.username,
                stats.totalReposts,
                stats.selfReposts,
                stats.stolenReposts,
                stats.victimOf,
                repostRatio,
                new Date(stats.firstActivity).toISOString(),
                new Date(stats.lastActivity).toISOString()
            ].join(','));
        }
        
        fs.writeFileSync(fileName, headers + lines.join('\n'));
        
        logMessage('AUTHOR_REPORT_GENERATED', {
            channelId,
            fileName,
            totalAuthors: authorStats.size,
            timestamp: getCurrentFormattedTime()
        });

        console.log(`Author report generated successfully: ${fileName}`);
        return fileName;

    } catch (error) {
        console.error('Error generating author report:', error);
        logMessage('AUTHOR_REPORT_ERROR', {
            channelId,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to generate author report: ${error.message}`);
    }
}

/**
 * Generates a summary of duplicate activity over time
 * @param {string} channelId - The ID of the channel being analyzed
 * @param {Map} imageDatabase - The database containing image hashes and their occurrences
 * @returns {Promise<string>} The filename of the generated timeline report
 */
async function generateTimelineReport(channelId, imageDatabase) {
    console.log(`Generating timeline report for channel ${channelId}`);
    const fileName = `timeline_report_${channelId}_${Date.now()}.csv`;
    
    try {
        const timelineData = new Map(); // Date -> {total: number, duplicates: number}
        
        for (const [hash, imageInfo] of imageDatabase.entries()) {
            const date = new Date(imageInfo.originalMessage.timestamp).toISOString().split('T')[0];
            
            if (!timelineData.has(date)) {
                timelineData.set(date, { total: 0, duplicates: 0 });
            }
            
            const dateStats = timelineData.get(date);
            dateStats.total++;
            dateStats.duplicates += imageInfo.duplicates.length;
        }

        const headers = ['Date', 'Total Images', 'Duplicates', 'Duplicate Ratio'].join(',') + '\n';
        const lines = [];

        for (const [date, stats] of timelineData.entries()) {
            const ratio = (stats.duplicates / stats.total).toFixed(2);
            lines.push([
                date,
                stats.total,
                stats.duplicates,
                ratio
            ].join(','));
        }

        fs.writeFileSync(fileName, headers + lines.join('\n'));

        logMessage('TIMELINE_REPORT_GENERATED', {
            channelId,
            fileName,
            totalDays: timelineData.size,
            timestamp: getCurrentFormattedTime()
        });

        console.log(`Timeline report generated successfully: ${fileName}`);
        return fileName;

    } catch (error) {
        console.error('Error generating timeline report:', error);
        logMessage('TIMELINE_REPORT_ERROR', {
            channelId,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to generate timeline report: ${error.message}`);
    }
}

module.exports = {
    generateReport,
    generateAuthorReport,
    generateTimelineReport
};