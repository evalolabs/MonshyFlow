/**
 * Cleanup Service
 * 
 * Automatically cleans up old executions and runs from MongoDB.
 * Runs daily at a configurable time.
 */

import { executionStorageService } from './executionStorageService';
import { runStorageService } from './runStorageService';
import { config } from '../config/config';

class CleanupService {
    private cleanupInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    /**
     * Start automatic cleanup job
     */
    start(): void {
        // Get retention days from config (default: 30 days)
        const retentionDays = parseInt(
            process.env.EXECUTION_RETENTION_DAYS || 
            process.env.CLEANUP_RETENTION_DAYS || 
            '30'
        );

        // Get cleanup interval (default: 24 hours = 86400000 ms)
        const cleanupIntervalMs = parseInt(
            process.env.CLEANUP_INTERVAL_MS || 
            '86400000' // 24 hours
        );

        console.log(`🧹 Cleanup Service: Retention=${retentionDays} days, Interval=${cleanupIntervalMs / 1000 / 60 / 60} hours`);

        // Run cleanup on startup (optional, can be disabled)
        // This will only delete executions OLDER than retentionDays (default: 30 days)
        const runOnStartup = process.env.CLEANUP_RUN_ON_STARTUP !== 'false';
        if (runOnStartup) {
            // Run after 1 minute to let services initialize
            // NOTE: This only deletes executions that are OLDER than retentionDays
            // New executions are NOT deleted - they are kept for the retention period
            setTimeout(() => {
                console.log(`[CleanupService] Running initial cleanup (will delete executions older than ${retentionDays} days)...`);
                this.runCleanup(retentionDays).catch(err => {
                    console.error('[CleanupService] Error in initial cleanup:', err);
                });
            }, 60000); // 1 minute delay to let services initialize
        }

        // Schedule periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.runCleanup(retentionDays).catch(err => {
                console.error('[CleanupService] Error in periodic cleanup:', err);
            });
        }, cleanupIntervalMs);

        console.log('✅ Cleanup Service started');
    }

    /**
     * Cleanup stale (zombie) executions that are stuck in 'running' status
     */
    private async cleanupStaleExecutions(): Promise<void> {
        try {
            // Find executions that have been running for more than 1 hour
            const staleThreshold = new Date();
            staleThreshold.setHours(staleThreshold.getHours() - 1);

            const staleExecutions = await executionStorageService.getRunningExecutions();
            let cleanedCount = 0;

            for (const execution of staleExecutions) {
                if (execution.startedAt < staleThreshold) {
                    await executionStorageService.updateExecution(execution.id!, {
                        status: 'failed',
                        error: 'Execution timeout: Execution was stuck in running status for more than 1 hour',
                        completedAt: new Date()
                    });
                    cleanedCount++;
                    console.log(`[CleanupService] Marked stale execution as failed: ${execution.id} (running since ${execution.startedAt.toISOString()})`);
                }
            }

            if (cleanedCount > 0) {
                console.log(`[CleanupService] Cleaned up ${cleanedCount} stale executions`);
            }
        } catch (error: any) {
            console.error('[CleanupService] Error cleaning up stale executions:', error);
        }
    }

    /**
     * Run cleanup for both executions and runs
     * 
     * IMPORTANT: This only deletes executions/runs that are OLDER than retentionDays.
     * For example, if retentionDays=30, only executions older than 30 days are deleted.
     * New executions are kept and will only be deleted after they reach the retention age.
     */
    private async runCleanup(retentionDays: number): Promise<void> {
        if (this.isRunning) {
            console.log('[CleanupService] Cleanup already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            // First, cleanup stale (zombie) executions
            console.log(`🧹 Starting cleanup (retention: ${retentionDays} days)...`);
            await this.cleanupStaleExecutions();

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            console.log(`[CleanupService] Will delete executions/runs older than ${cutoffDate.toISOString()}`);

            // Cleanup executions (only deletes executions older than retentionDays)
            const deletedExecutions = await executionStorageService.deleteOldExecutions(retentionDays);
            console.log(`[CleanupService] Deleted ${deletedExecutions} old executions (older than ${retentionDays} days)`);

            // Cleanup runs (only deletes runs older than retentionDays)
            const deletedRuns = await runStorageService.deleteOldRuns(retentionDays);
            console.log(`[CleanupService] Deleted ${deletedRuns} old runs (older than ${retentionDays} days)`);

            const duration = Date.now() - startTime;
            console.log(`✅ Cleanup completed in ${duration}ms (Executions: ${deletedExecutions}, Runs: ${deletedRuns})`);
            console.log(`[CleanupService] Note: Only executions/runs older than ${retentionDays} days were deleted. Recent executions are preserved.`);
        } catch (error: any) {
            console.error('[CleanupService] Cleanup failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Stop cleanup service
     */
    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('⏹️  Cleanup Service stopped');
        }
    }

    /**
     * Manually trigger cleanup
     */
    async triggerCleanup(retentionDays?: number): Promise<{ executions: number; runs: number }> {
        const days = retentionDays || parseInt(
            process.env.EXECUTION_RETENTION_DAYS || 
            process.env.CLEANUP_RETENTION_DAYS || 
            '30'
        );

        const deletedExecutions = await executionStorageService.deleteOldExecutions(days);
        const deletedRuns = await runStorageService.deleteOldRuns(days);

        return {
            executions: deletedExecutions,
            runs: deletedRuns
        };
    }
}

export const cleanupService = new CleanupService();

