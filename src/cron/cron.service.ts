import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  /**
   * Add a new cron job dynamically
   * @param name Unique name for the cron job
   * @param cronTime Cron expression (e.g., '0 0 * * *' for daily at midnight)
   * @param callback Function to execute when cron triggers
   * @param timezone Optional timezone (e.g., 'America/New_York')
   */
  addCronJob(
    name: string,
    cronTime: string,
    callback: () => void,
    timezone?: string,
  ): void {
    try {
      const job = new CronJob(
        cronTime,
        callback,
        null,
        true,
        timezone || 'UTC',
      );

      this.schedulerRegistry.addCronJob(name, job);
      job.start();
      this.logger.log(`Cron job '${name}' added with schedule: ${cronTime}`);
    } catch (error) {
      this.logger.error(`Failed to add cron job '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove a cron job by name
   * @param name Name of the cron job to remove
   */
  deleteCronJob(name: string): void {
    try {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.warn(`Cron job '${name}' deleted`);
    } catch (error) {
      this.logger.error(
        `Failed to delete cron job '${name}': ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Stop a cron job without removing it
   * @param name Name of the cron job to stop
   */
  stopCronJob(name: string): void {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      job.stop();
      this.logger.log(`Cron job '${name}' stopped`);
    } catch (error) {
      this.logger.error(`Failed to stop cron job '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Start a previously stopped cron job
   * @param name Name of the cron job to start
   */
  startCronJob(name: string): void {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      job.start();
      this.logger.log(`Cron job '${name}' started`);
    } catch (error) {
      this.logger.error(`Failed to start cron job '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all registered cron jobs
   * @returns Array of cron job names
   */
  getCronJobs(): string[] {
    const jobs = this.schedulerRegistry.getCronJobs();
    return Array.from(jobs.keys());
  }

  /**
   * Check if a cron job exists
   * @param name Name of the cron job to check
   * @returns Boolean indicating if job exists
   */
  cronJobExists(name: string): boolean {
    try {
      this.schedulerRegistry.getCronJob(name);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the status of a cron job
   * @param name Name of the cron job
   * @returns Object containing job status information
   */
  getCronJobStatus(name: string): {
    name: string;
    running: boolean;
    lastDate?: Date;
    nextDate?: Date;
  } {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      const lastDate = job.lastDate();
      const nextDate = job.nextDate();

      return {
        name,
        running: (job as any).running ?? false,
        lastDate: lastDate ? new Date(lastDate.toString()) : undefined,
        nextDate: nextDate ? new Date(nextDate.toString()) : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get status for cron job '${name}': ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get status of all cron jobs
   * @returns Array of job status objects
   */
  getAllCronJobsStatus(): Array<{
    name: string;
    running: boolean;
    lastDate?: Date;
    nextDate?: Date;
  }> {
    const jobNames = this.getCronJobs();
    return jobNames.map((name) => this.getCronJobStatus(name));
  }
}