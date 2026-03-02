import { Module } from '@nestjs/common';
import { OrderFulfillmentProcessor } from './order-fulfillment.processor';

@Module({
  providers: [OrderFulfillmentProcessor],
})
export class FulfillmentModule {}
