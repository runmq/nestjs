export { RunMQModule } from './runmq.module';

export { RunMQService } from './runmq.service';
export { RunMQPublisherService } from './runmq-publisher.service';

export { Processor } from './decorators/processor.decorator';
export { ProcessMessage } from './decorators/process-message.decorator';
export { InjectRunMQ } from './decorators/inject-runmq.decorator';

export type { RunMQModuleOptions, RunMQOptionsFactory } from './interfaces/runmq-module-options.interface';
export type { RunMQAsyncModuleOptions } from './interfaces/runmq-async-options.interface';
export type { ProcessorDecoratorOptions } from './decorators/processor.decorator';

export type {
  RunMQMessageContent,
  RunMQMessageMetaContent,
  RunMQConnectionConfig,
  RunMQProcessorConfiguration,
  MessageSchema,
  SchemaType,
  SchemaFailureStrategy,
  RabbitMQManagementConfig,
  RunMQLogger,
  RunMQQueueMetadata,
} from 'runmq';
export { RunMQ } from 'runmq';
