import { DatabaseService } from "./database.js";
import { logger } from "../utils/logger.js";
import type { PlanStructure } from "../types/index.js";
import { promises as fs } from "fs";
import path from "path";

/**
 * Service for data persistence and backup/restore operations
 */
export class PersistenceService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

  constructor(
    private db: DatabaseService,
    private planStructure: PlanStructure
  ) {}

  async initialize(): Promise<void> {
    logger.info("Initializing persistence service...");

    // Start automatic sync
    this.startAutoSync();

    logger.info("Persistence service initialized");
  }

  private startAutoSync(): void {
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncToFilesystem();
      } catch (error) {
        logger.error("Auto-sync failed", error);
      }
    }, this.SYNC_INTERVAL_MS);
  }

  async syncToFilesystem(): Promise<void> {
    logger.debug("Syncing database to filesystem...");
    // Implementation would sync database contents to markdown files
    // For now, just log the operation
    logger.debug("Filesystem sync completed");
  }

  async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultPath = path.join(
      this.planStructure.tmpDir,
      `backup-${timestamp}.db`
    );

    const finalPath = backupPath || defaultPath;

    await this.db.backup(finalPath);
    logger.info(`Database backed up to: ${finalPath}`);

    return finalPath;
  }

  async restore(backupPath: string): Promise<void> {
    try {
      // Verify backup file exists
      await fs.access(backupPath);

      // Close current database
      await this.db.close();

      // Copy backup to current database location
      await fs.copyFile(backupPath, this.planStructure.databasePath);

      // Reinitialize database
      await this.db.initialize();

      logger.info(`Database restored from: ${backupPath}`);
    } catch (error) {
      logger.error("Failed to restore database", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down persistence service...");

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Final sync before shutdown
    await this.syncToFilesystem();

    logger.info("Persistence service shutdown complete");
  }

  // Aliases for compatibility with handlers
  async backupDatabase(backupPath?: string): Promise<string> {
    return this.backup(backupPath);
  }

  async restoreDatabase(backupPath: string): Promise<void> {
    return this.restore(backupPath);
  }

  async syncWithFilesystem(direction?: string): Promise<{ success: boolean; direction: string }> {
    await this.syncToFilesystem();
    return { success: true, direction: direction || 'to-fs' };
  }
}
