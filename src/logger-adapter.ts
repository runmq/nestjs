import { Logger } from '@nestjs/common';
import type { RunMQLogger } from 'runmq';

export class NestJSRunMQLogger implements RunMQLogger {
  private readonly logger = new Logger('RunMQ');

  log(message: string, ...optionalParams: any[]): void {
    this.logger.log(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    this.logger.warn(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: any[]): void {
    this.logger.log(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]): void {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: string, ...optionalParams: any[]): void {
    this.logger.verbose(message, ...optionalParams);
  }
}
