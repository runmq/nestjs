import { Module } from '@nestjs/common';
import { OrderNotificationProcessor } from './order-notification.processor';

@Module({
  providers: [OrderNotificationProcessor],
})
export class NotificationsModule {}
