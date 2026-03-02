import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { RunMQ } from 'runmq';
import { RUNMQ_INSTANCE } from './constants';

@Injectable()
export class RunMQService implements OnModuleDestroy {
  private readonly logger = new Logger(RunMQService.name);

  constructor(
    @Inject(RUNMQ_INSTANCE) private readonly _instance: RunMQ,
  ) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this._instance.disconnect();
    } catch (error) {
      this.logger.error(
        `RunMQ disconnect error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  get instance(): RunMQ {
    return this._instance;
  }
}
