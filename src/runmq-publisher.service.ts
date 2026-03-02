import { Injectable, Inject } from '@nestjs/common';
import { RunMQ } from 'runmq';
import { RUNMQ_INSTANCE } from './constants';

@Injectable()
export class RunMQPublisherService {
  constructor(
    @Inject(RUNMQ_INSTANCE) private readonly runmq: RunMQ,
  ) {}

  publish(topic: string, message: Record<string, any>, correlationId?: string): void {
    if (!this.runmq.isActive()) {
      throw new Error('RunMQ is not connected');
    }
    this.runmq.publish(topic, message, correlationId);
  }
}
