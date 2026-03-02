import { Inject } from '@nestjs/common';
import { RUNMQ_INSTANCE } from '../constants';

export const InjectRunMQ = (): ParameterDecorator => Inject(RUNMQ_INSTANCE);
