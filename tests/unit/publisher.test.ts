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

  it('should delegate publish(topic, message) to runmq.publish()', async () => {
    mockRunMQ.isActive.mockReturnValue(true);
    mockRunMQ.publish.mockResolvedValue(undefined);

    await service.publish('user.created', { email: 'test@test.com' });

    expect(mockRunMQ.publish).toHaveBeenCalledWith(
      'user.created',
      { email: 'test@test.com' },
      undefined,
    );
  });

  it('should pass correlationId when provided', async () => {
    mockRunMQ.isActive.mockReturnValue(true);
    mockRunMQ.publish.mockResolvedValue(undefined);

    await service.publish('order.created', { orderId: '123' }, 'corr-456');

    expect(mockRunMQ.publish).toHaveBeenCalledWith(
      'order.created',
      { orderId: '123' },
      'corr-456',
    );
  });

  it('should reject when RunMQ is not connected', async () => {
    mockRunMQ.isActive.mockReturnValue(false);

    await expect(
      service.publish('test', { data: 'value' }),
    ).rejects.toThrow('RunMQ is not connected');
  });

  it('should not call runmq.publish when not connected', async () => {
    mockRunMQ.isActive.mockReturnValue(false);

    await expect(service.publish('test', {})).rejects.toBeDefined();

    expect(mockRunMQ.publish).not.toHaveBeenCalled();
  });

  it('should propagate broker rejections from runmq.publish', async () => {
    mockRunMQ.isActive.mockReturnValue(true);
    const err = new Error('NACK from broker');
    mockRunMQ.publish.mockRejectedValue(err);

    await expect(
      service.publish('user.created', { email: 'x@y.com' }),
    ).rejects.toThrow('NACK from broker');
  });
});
