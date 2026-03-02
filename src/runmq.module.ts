import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RunMQ } from 'runmq';
import { RUNMQ_INSTANCE, RUNMQ_MODULE_OPTIONS } from './constants';
import { RunMQModuleOptions, RunMQOptionsFactory } from './interfaces/runmq-module-options.interface';
import { RunMQAsyncModuleOptions } from './interfaces/runmq-async-options.interface';
import { RunMQService } from './runmq.service';
import { RunMQExplorerService } from './runmq-explorer.service';
import { RunMQPublisherService } from './runmq-publisher.service';
import { NestJSRunMQLogger } from './logger-adapter';

@Module({})
export class RunMQModule {
  static forRoot(options: RunMQModuleOptions): DynamicModule {
    return RunMQModule.buildDynamicModule(
      [{ provide: RUNMQ_MODULE_OPTIONS, useValue: options }],
    );
  }

  static forRootAsync(options: RunMQAsyncModuleOptions): DynamicModule {
    return RunMQModule.buildDynamicModule(
      RunMQModule.createAsyncProviders(options),
      options.imports,
    );
  }

  private static buildDynamicModule(
    optionsProviders: Provider[],
    extraImports: any[] = [],
  ): DynamicModule {
    return {
      global: true,
      module: RunMQModule,
      imports: [DiscoveryModule, ...extraImports],
      providers: [
        ...optionsProviders,
        {
          provide: RUNMQ_INSTANCE,
          useFactory: async (options: RunMQModuleOptions) =>
            RunMQ.start(options, new NestJSRunMQLogger()),
          inject: [RUNMQ_MODULE_OPTIONS],
        },
        RunMQService,
        RunMQExplorerService,
        RunMQPublisherService,
      ],
      exports: [RunMQService, RUNMQ_INSTANCE, RunMQPublisherService],
    };
  }

  private static createAsyncProviders(options: RunMQAsyncModuleOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: RUNMQ_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: RUNMQ_MODULE_OPTIONS,
          useFactory: async (factory: RunMQOptionsFactory) =>
            factory.createRunMQOptions(),
          inject: [options.useClass],
        },
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: RUNMQ_MODULE_OPTIONS,
          useFactory: async (factory: RunMQOptionsFactory) =>
            factory.createRunMQOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    throw new Error(
      'RunMQModule.forRootAsync() requires useFactory, useClass, or useExisting',
    );
  }
}
