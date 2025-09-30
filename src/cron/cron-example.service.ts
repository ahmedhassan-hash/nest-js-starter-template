import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CronService } from './cron.service';

/**
 * Example service demonstrating various ways to use cron jobs
 * You can delete this file if not needed
 */
@Injectable()
export class CronExampleService implements OnModuleInit {
  private readonly logger = new Logger(CronExampleService.name);

  constructor(private cronService: CronService) {}

  onModuleInit() {
    // Example of adding a dynamic cron job on module initialization
    this.addDynamicCronJob();
  }

  /**
   * Example 1: Using decorator for static cron job
   * Runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleDailyCron() {
    this.logger.debug('Daily cron job executed at midnight');
    // Your logic here
  }

  /**
   * Example 2: Using decorator with custom cron expression
   * Runs every 30 minutes
   */
  @Cron('0 */30 * * * *')
  handleEvery30Minutes() {
    this.logger.debug('Cron job executed every 30 minutes');
    // Your logic here
  }

  /**
   * Example 3: Using decorator for hourly execution
   */
  @Cron(CronExpression.EVERY_HOUR)
  handleHourlyCron() {
    this.logger.debug('Hourly cron job executed');
    // Your logic here
  }

  /**
   * Example 4: Adding a dynamic cron job
   * This can be added at runtime based on business logic
   */
  addDynamicCronJob() {
    const jobName = 'dynamic-example-job';

    if (!this.cronService.cronJobExists(jobName)) {
      this.cronService.addCronJob(
        jobName,
        '0 */15 * * * *', // Every 15 minutes
        () => {
          this.logger.debug('Dynamic cron job executed');
          // Your logic here
        },
        'UTC',
      );
    }
  }

  /**
   * Example 5: Managing cron jobs programmatically
   */
  manageCronJobExample() {
    const jobName = 'manageable-job';

    // Add job
    this.cronService.addCronJob(
      jobName,
      '0 0 * * * *', // Every hour
      () => {
        this.logger.debug('Manageable cron job executed');
      },
    );

    // Get status
    const status = this.cronService.getCronJobStatus(jobName);
    this.logger.log(`Job status: ${JSON.stringify(status)}`);

    // Stop job
    // this.cronService.stopCronJob(jobName);

    // Start job
    // this.cronService.startCronJob(jobName);

    // Delete job
    // this.cronService.deleteCronJob(jobName);
  }
}