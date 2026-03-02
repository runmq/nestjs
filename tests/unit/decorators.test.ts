import 'reflect-metadata';
import { RUNMQ_PROCESSOR_METADATA, RUNMQ_HANDLER_METADATA, RUNMQ_INSTANCE } from '@src/constants';
import { Processor } from '@src/decorators/processor.decorator';
import { ProcessMessage } from '@src/decorators/process-message.decorator';
import { InjectRunMQ } from '@src/decorators/inject-runmq.decorator';
import { Inject } from '@nestjs/common';

describe('@Processor decorator', () => {
  it('should store processor options as metadata on the class', () => {
    const options = { topic: 'user.created', name: 'emailService' };

    @Processor(options)
    class TestProcessor {}

    const metadata = Reflect.getMetadata(RUNMQ_PROCESSOR_METADATA, TestProcessor);
    expect(metadata).toEqual(options);
  });

  it('should store full options with optional fields', () => {
    const options = {
      topic: 'order.created',
      name: 'orderProcessor',
      consumersCount: 3,
      attempts: 2,
      attemptsDelay: 500,
      usePoliciesForDelay: true,
    };

    @Processor(options)
    class OrderProcessor {}

    const metadata = Reflect.getMetadata(RUNMQ_PROCESSOR_METADATA, OrderProcessor);
    expect(metadata).toEqual(options);
  });
});

describe('@ProcessMessage decorator', () => {
  it('should store the method name as metadata on the method', () => {
    class TestProcessor {
      @ProcessMessage()
      handleMessage() {}
    }

    const metadata = Reflect.getMetadata(RUNMQ_HANDLER_METADATA, TestProcessor.prototype, 'handleMessage');
    expect(metadata).toBe('handleMessage');
  });

  it('should work with differently named methods', () => {
    class AnotherProcessor {
      @ProcessMessage()
      process() {}
    }

    const metadata = Reflect.getMetadata(RUNMQ_HANDLER_METADATA, AnotherProcessor.prototype, 'process');
    expect(metadata).toBe('process');
  });
});

describe('@InjectRunMQ decorator', () => {
  it('should be a function that returns a ParameterDecorator', () => {
    expect(typeof InjectRunMQ).toBe('function');
    const decorator = InjectRunMQ();
    expect(typeof decorator).toBe('function');
  });

  it('should apply the same metadata as @Inject(RUNMQ_INSTANCE)', () => {
    // Both decorators should store RUNMQ_INSTANCE as the injection token
    // We verify by applying each to a class and checking NestJS self:paramtypes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class ServiceA { constructor(@InjectRunMQ() runmq: any) {} }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class ServiceB { constructor(@Inject(RUNMQ_INSTANCE) runmq: any) {} }

    const metaA = Reflect.getMetadata('self:paramtypes', ServiceA);
    const metaB = Reflect.getMetadata('self:paramtypes', ServiceB);
    expect(metaA).toEqual(metaB);
  });
});
