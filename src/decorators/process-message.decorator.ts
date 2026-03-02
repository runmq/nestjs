import 'reflect-metadata';
import { RUNMQ_HANDLER_METADATA } from '../constants';

export function ProcessMessage(): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(RUNMQ_HANDLER_METADATA, propertyKey, target, propertyKey);
  };
}
