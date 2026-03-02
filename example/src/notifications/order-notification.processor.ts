import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessMessage, RunMQMessageContent } from '@runmq/nestjs';
import { Order } from '../orders/orders.service';

@Processor({
  topic: 'order.created',
  name: 'orderNotifications',
  consumersCount: 1,
  attempts: 5,
  attemptsDelay: 1000,
  usePoliciesForDelay: true,
})
@Injectable()
export class OrderNotificationProcessor {
  private readonly logger = new Logger(OrderNotificationProcessor.name);

  @ProcessMessage()
  async handle(message: RunMQMessageContent<Order>) {
    const order = message.message;
    this.logger.log(`[Notifications] Sending confirmation for order ${order.id} (correlationId: ${message.meta.correlationId})`);

    // Simulate sending an email / push notification
    await new Promise((resolve) => setTimeout(resolve, 50));

    this.logger.log(`[Notifications] Confirmation sent for order ${order.id}`);
  }
}
