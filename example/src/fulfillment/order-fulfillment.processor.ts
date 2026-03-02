import { Injectable, Logger } from '@nestjs/common';
import { Processor, ProcessMessage, RunMQMessageContent } from '@runmq/nestjs';
import { Order } from '../orders/orders.service';

@Processor({
  topic: 'order.created',
  name: 'orderFulfillment',
  consumersCount: 2,
  attempts: 3,
  attemptsDelay: 2000,
  usePoliciesForDelay: true,
})
@Injectable()
export class OrderFulfillmentProcessor {
  private readonly logger = new Logger(OrderFulfillmentProcessor.name);

  @ProcessMessage()
  async handle(message: RunMQMessageContent<Order>) {
    const order = message.message;
    this.logger.log(`[Fulfillment] Processing order ${order.id} — ${order.quantity}x ${order.item}`);

    // Simulate fulfillment work
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`[Fulfillment] Order ${order.id} fulfilled`);
  }
}
