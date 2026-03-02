import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { RunMQModule } from '@src/runmq.module';
import { RunMQService } from '@src/runmq.service';
import { RUNMQ_INSTANCE, RUNMQ_MODULE_OPTIONS } from '@src/constants';

jest.mock('runmq', () => ({
  RunMQ: {
    start: jest.fn(),
  },
}));

import { RunMQ } from 'runmq';

describe('RunMQModule Registration', () => {
  const mockRunMQInstance = {
    disconnect: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
    process: jest.fn(),
    publish: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (RunMQ.start as jest.Mock).mockResolvedValue(mockRunMQInstance);
  });

  describe('forRoot()', () => {
    let module: TestingModule;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          RunMQModule.forRoot({
            url: 'amqp://localhost:5672',
          }),
        ],
      }).compile();

      await module.init();
    });

    afterEach(async () => {
      await module.close();
    });

    it('should provide RunMQService', () => {
      const service = module.get(RunMQService);
      expect(service).toBeDefined();
    });

    it('should resolve RUNMQ_INSTANCE token', () => {
      const instance = module.get(RUNMQ_INSTANCE);
      expect(instance).toBe(mockRunMQInstance);
    });

    it('should call RunMQ.start() on module init', () => {
      expect(RunMQ.start).toHaveBeenCalledWith(
        { url: 'amqp://localhost:5672' },
        expect.any(Object),
      );
    });

    it('should call runmq.disconnect() on module destroy', async () => {
      await module.close();
      expect(mockRunMQInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe('forRootAsync() - useFactory', () => {
    it('should resolve RUNMQ_MODULE_OPTIONS from factory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          RunMQModule.forRootAsync({
            useFactory: () => ({ url: 'amqp://async-url:5672' }),
          }),
        ],
      }).compile();

      await module.init();

      const options = module.get(RUNMQ_MODULE_OPTIONS);
      expect(options).toEqual({ url: 'amqp://async-url:5672' });

      await module.close();
    });

    it('should inject dependencies into factory via imports', async () => {
      const CONFIG_SERVICE = 'CONFIG_SERVICE';
      const configValue = 'amqp://injected:5672';

      const { Module: NestModule } = await import('@nestjs/common');

      @NestModule({ providers: [{ provide: CONFIG_SERVICE, useValue: configValue }], exports: [CONFIG_SERVICE] })
      class ConfigModule {}

      const module = await Test.createTestingModule({
        imports: [
          RunMQModule.forRootAsync({
            imports: [ConfigModule],
            inject: [CONFIG_SERVICE],
            useFactory: (url: string) => ({ url }),
          }),
        ],
      }).compile();

      await module.init();
      const options = module.get(RUNMQ_MODULE_OPTIONS);
      expect(options.url).toBe(configValue);

      await module.close();
    });
  });

  describe('forRootAsync() - useClass', () => {
    it('should resolve RUNMQ_MODULE_OPTIONS from class', async () => {
      class MockOptionsFactory {
        createRunMQOptions() {
          return { url: 'amqp://class-url:5672' };
        }
      }

      const module = await Test.createTestingModule({
        imports: [
          RunMQModule.forRootAsync({
            useClass: MockOptionsFactory,
          }),
        ],
      }).compile();

      await module.init();
      const options = module.get(RUNMQ_MODULE_OPTIONS);
      expect(options).toEqual({ url: 'amqp://class-url:5672' });

      await module.close();
    });
  });
});
