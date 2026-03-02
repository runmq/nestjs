import 'reflect-metadata';
import { RUNMQ_PROCESSOR_METADATA } from '../constants';
import type { MessageSchema } from 'runmq';

export interface ProcessorDecoratorOptions {
  topic: string;
  name: string;
  consumersCount?: number;
  attempts?: number;
  attemptsDelay?: number;
  messageSchema?: MessageSchema;
  usePoliciesForDelay?: boolean;
}

export function Processor(options: ProcessorDecoratorOptions): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(RUNMQ_PROCESSOR_METADATA, options, target);
  };
}
