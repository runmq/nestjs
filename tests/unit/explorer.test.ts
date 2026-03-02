import 'reflect-metadata';
import { RunMQExplorerService } from '@src/runmq-explorer.service';
import { Processor } from '@src/decorators/processor.decorator';
import { ProcessMessage } from '@src/decorators/process-message.decorator';

function createMockDiscoveryService(providers: any[]) {
  return {
    getProviders: jest.fn().mockReturnValue(providers),
  };
}

function makeWrapper(instance: any, metatype: any) {
  return { instance, metatype };
}

describe('RunMQExplorerService', () => {
  const mockRunMQ = {
    process: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should discover and register a processor with runmq.process()', async () => {
    @Processor({ topic: 'user.created', name: 'emailService' })
    class EmailProcessor {
      @ProcessMessage()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async handleMessage(message: any) {}
    }

    const discovery = createMockDiscoveryService([
      makeWrapper(new EmailProcessor(), EmailProcessor),
    ]);

    const service = new RunMQExplorerService(
      discovery as any,
      mockRunMQ as any,
    );
    await service.onModuleInit();

    expect(mockRunMQ.process).toHaveBeenCalledWith(
      'user.created',
      { name: 'emailService', consumersCount: 1 },
      expect.any(Function),
    );
  });

  it('should throw error when no @ProcessMessage handler found', async () => {
    @Processor({ topic: 'test', name: 'noHandler' })
    class NoHandlerProcessor {
      someMethod() {}
    }

    const discovery = createMockDiscoveryService([
      makeWrapper(new NoHandlerProcessor(), NoHandlerProcessor),
    ]);

    const service = new RunMQExplorerService(
      discovery as any,
      mockRunMQ as any,
    );

    await expect(service.onModuleInit()).rejects.toThrow(
      'No @ProcessMessage handler found in NoHandlerProcessor',
    );
  });

  it('should throw error when multiple @ProcessMessage handlers found', async () => {
    @Processor({ topic: 'test', name: 'multiHandler' })
    class MultiHandlerProcessor {
      @ProcessMessage()
      handleA() {}

      @ProcessMessage()
      handleB() {}
    }

    const discovery = createMockDiscoveryService([
      makeWrapper(new MultiHandlerProcessor(), MultiHandlerProcessor),
    ]);

    const service = new RunMQExplorerService(
      discovery as any,
      mockRunMQ as any,
    );

    await expect(service.onModuleInit()).rejects.toThrow(
      'Multiple @ProcessMessage handlers in MultiHandlerProcessor',
    );
  });

  it('should throw error for duplicate processor names', async () => {
    @Processor({ topic: 'topic1', name: 'duplicate' })
    class ProcessorA {
      @ProcessMessage()
      handle() {}
    }

    @Processor({ topic: 'topic2', name: 'duplicate' })
    class ProcessorB {
      @ProcessMessage()
      handle() {}
    }

    const discovery = createMockDiscoveryService([
      makeWrapper(new ProcessorA(), ProcessorA),
      makeWrapper(new ProcessorB(), ProcessorB),
    ]);

    const service = new RunMQExplorerService(
      discovery as any,
      mockRunMQ as any,
    );

    await expect(service.onModuleInit()).rejects.toThrow(
      'Duplicate processor name: duplicate',
    );
  });

  it('should skip providers without @Processor metadata', async () => {
    class RegularService {
      doSomething() {}
    }

    const discovery = createMockDiscoveryService([
      makeWrapper(new RegularService(), RegularService),
    ]);

    const service = new RunMQExplorerService(
      discovery as any,
      mockRunMQ as any,
    );

    await service.onModuleInit();
    expect(mockRunMQ.process).not.toHaveBeenCalled();
  });
});
