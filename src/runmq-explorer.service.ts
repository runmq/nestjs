import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { RunMQ } from 'runmq';
import { RUNMQ_PROCESSOR_METADATA, RUNMQ_HANDLER_METADATA, RUNMQ_INSTANCE } from './constants';
import type { ProcessorDecoratorOptions } from './decorators/processor.decorator';

@Injectable()
export class RunMQExplorerService implements OnModuleInit {
  constructor(
    @Inject(DiscoveryService) private readonly discoveryService: DiscoveryService,
    @Inject(RUNMQ_INSTANCE) private readonly runmq: RunMQ,
  ) {}

  async onModuleInit(): Promise<void> {
    const providers = this.discoveryService.getProviders();
    const registeredNames = new Set<string>();

    for (const wrapper of providers) {
      const { instance, metatype } = wrapper;

      if (!instance || !metatype) continue;

      const processorOptions: ProcessorDecoratorOptions | undefined =
        Reflect.getMetadata(RUNMQ_PROCESSOR_METADATA, metatype);

      if (!processorOptions) continue;

      const className = metatype.name;

      // Check for duplicate processor names
      if (registeredNames.has(processorOptions.name)) {
        throw new Error(`Duplicate processor name: ${processorOptions.name}`);
      }

      // Find method decorated with @ProcessMessage()
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (key) => key !== 'constructor',
      );

      const handlerMethods = methodNames.filter((key) =>
        Reflect.getMetadata(RUNMQ_HANDLER_METADATA, prototype, key),
      );

      if (handlerMethods.length === 0) {
        throw new Error(
          `No @ProcessMessage handler found in ${className}`,
        );
      }

      if (handlerMethods.length > 1) {
        throw new Error(
          `Multiple @ProcessMessage handlers in ${className}`,
        );
      }

      registeredNames.add(processorOptions.name);

      const handlerName = handlerMethods[0];
      const handler = instance[handlerName].bind(instance);

      const { topic, ...config } = processorOptions;
      await this.runmq.process(
        topic,
        { ...config, consumersCount: config.consumersCount ?? 1 },
        handler,
      );
    }
  }
}
