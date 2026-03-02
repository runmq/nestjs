import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { RunMQModule } from '@src/runmq.module';
import { Processor } from '@src/decorators/processor.decorator';
import { ProcessMessage } from '@src/decorators/process-message.decorator';

jest.mock('runmq', () => ({
  RunMQ: {
    start: jest.fn(),
  },
}));

import { RunMQ } from 'runmq';

describe('Processor Discovery Integration', () => {
  const mockProcess = jest.fn();
  const mockRunMQInstance = {
    disconnect: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
    process: mockProcess,
    publish: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (RunMQ.start as jest.Mock).mockResolvedValue(mockRunMQInstance);
  });

  it('should discover and register a decorated processor on module init', async () => {
    @Processor({ topic: 'user.created', name: 'emailService', consumersCount: 1 })
    @Injectable()
    class EmailProcessor {
      @ProcessMessage()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async handle(message: any) {}
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        RunMQModule.forRoot({ url: 'amqp://localhost:5672' }),
      ],
      providers: [EmailProcessor],
    }).compile();

    await module.init();

    expect(mockProcess).toHaveBeenCalledWith(
      'user.created',
      { name: 'emailService', consumersCount: 1 },
      expect.any(Function),
    );

    await module.close();
  });
});
