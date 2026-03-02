import type { ModuleMetadata, Type } from '@nestjs/common';
import type { RunMQModuleOptions, RunMQOptionsFactory } from './runmq-module-options.interface';

export interface RunMQAsyncModuleOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => RunMQModuleOptions | Promise<RunMQModuleOptions>;
  inject?: any[];
  useClass?: Type<RunMQOptionsFactory>;
  useExisting?: Type<RunMQOptionsFactory>;
}
