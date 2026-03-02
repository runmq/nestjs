import 'reflect-metadata';
import { RunMQPublisherService } from '@src/runmq-publisher.service';

describe('RunMQPublisherService', () => {
  const mockRunMQ = {
    publish: jest.fn(),
    isActive: jest.fn(),
  };

  let service: RunMQPublisherService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RunMQPublisherService(mockRunMQ as any);
  });

  it('should delegate publish(topic, message) to runmq.publish()', () => {
    mockRunMQ.isActive.mockReturnValue(true);

    service.publish('user.created', { email: 'test@test.com' });

    expect(mockRunMQ.publish).toHaveBeenCalledWith(
      'user.created',
      { email: 'test@test.com' },
      undefined,
    );
  });

  it('should pass correlationId when provided', () => {
    mockRunMQ.isActive.mockReturnValue(true);

    service.publish('order.created', { orderId: '123' }, 'corr-456');

    expect(mockRunMQ.publish).toHaveBeenCalledWith(
      'order.created',
      { orderId: '123' },
      'corr-456',
    );
  });

  it('should throw error when RunMQ is not connected', () => {
    mockRunMQ.isActive.mockReturnValue(false);

    expect(() =>
      service.publish('test', { data: 'value' }),
    ).toThrow('RunMQ is not connected');
  });

  it('should not call runmq.publish when not connected', () => {
    mockRunMQ.isActive.mockReturnValue(false);

    try {
      service.publish('test', {});
    } catch {
      // expected
    }

    expect(mockRunMQ.publish).not.toHaveBeenCalled();
  });
});
