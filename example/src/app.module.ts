import { Module } from '@nestjs/common';
import { RunMQModule } from 'nestjs-runmq';
import { OrdersModule } from './orders/orders.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    RunMQModule.forRoot({
      url: 'amqp://localhost:5678',
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      management: {
        url: 'http://localhost:15678',
        username: 'guest',
        password: 'guest',
      },
    }),
    OrdersModule,
    FulfillmentModule,
    NotificationsModule,
  ],
})
export class AppModule {}
