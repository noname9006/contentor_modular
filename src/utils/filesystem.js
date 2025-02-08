const fs = require('fs').promises;
const path = require('path');
const { logMessage } = require('./logging');

class FileSystemUtil {
    /**
     * Ensures a directory exists, creating it if necessary
     * @param {string} dirPath - Path to the directory
     */
    static async ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            logMessage('DIRECTORY_CREATED', { path: dirPath });
        }
    }

    /**
     * Safely writes data to a file with error handling
     * @param {string} filePath - Path to the file
     * @param {string|Buffer} data - Data to write
     * @param {object} options - Write options
     */
    static async safeWrite(filePath, data, options = {}) {
        try {
            await this.ensureDirectory(path.dirname(filePath));
            await fs.writeFile(filePath, data, options);
            logMessage('FILE_WRITTEN', { path: filePath });
        } catch (error) {
            logMessage('FILE_WRITE_ERROR', { 
                path: filePath, 
                error: error.message 
            });
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Safely reads data from a file with error handling
     * @param {string} filePath - Path to the file
     * @param {object} options - Read options
     * @returns {Promise<string|Buffer>} The file contents
     */
    static async safeRead(filePath, options = {}) {
        try {
            await fs.access(filePath);
            const data = await fs.readFile(filePath, options);
            return data;
        } catch (error) {
            logMessage('FILE_READ_ERROR', { 
                path: filePath, 
                error: error.message 
            });
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Safely deletes a file with error handling
     * @param {string} filePath - Path to the file
     */
    static async safeDelete(filePath) {
        try {
            await fs.unlink(filePath);
            logMessage('FILE_DELETED', { path: filePath });
        } catch (error) {
            if (error.code !== 'ENOENT') { // Don't log if file doesn't exist
                logMessage('FILE_DELETE_ERROR', { 
                    path: filePath, 
                    error: error.message 
                });
                throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
            }
        }
    }

    /**
     * Checks if a file exists
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>} Whether the file exists
     */
    static async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets file stats with error handling
     * @param {string} filePath - Path to the file
     * @returns {Promise<fs.Stats>} File stats
     */
    static async getStats(filePath) {
        try {
            return await fs.stat(filePath);
        } catch (error) {
            logMessage('FILE_STAT_ERROR', { 
                path: filePath, 
                error: error.message 
            });
            throw new Error(`Failed to get stats for ${filePath}: ${error.message}`);
        }
    }

    /**
     * Cleanup temporary files older than specified age
     * @param {string} tempDir - Directory containing temporary files
     * @param {number} maxAgeMs - Maximum age in milliseconds
     */
    static async cleanupTempFiles(tempDir, maxAgeMs) {
        try {
            const files = await fs.readdir(tempDir);
            const now = Date.now();

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await this.getStats(filePath);
                
                if (now - stats.mtime.getTime() > maxAgeMs) {
                    await this.safeDelete(filePath);
                }
            }
        } catch (error) {
            logMessage('CLEANUP_ERROR', { 
                directory: tempDir, 
                error: error.message 
            });
        }
    }
}

module.exports = FileSystemUtil;