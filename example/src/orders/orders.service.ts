import { Injectable } from '@nestjs/common';
import { RunMQPublisherService } from 'nestjs-runmq';
import { CreateOrderDto } from './dto/create-order.dto';

export interface Order {
  id: string;
  item: string;
  quantity: number;
  createdAt: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly publisher: RunMQPublisherService) {}

  create(dto: CreateOrderDto): Order {
    const order: Order = {
      id: crypto.randomUUID(),
      item: dto.item,
      quantity: dto.quantity,
      createdAt: new Date().toISOString(),
    };

    this.publisher.publish('order.created', order);

    return order;
  }
}
