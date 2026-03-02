# Example: NestJS Order System

A minimal NestJS application demonstrating `@runmq/nestjs`. It models a simple order system where:

- `POST /orders` creates an order and publishes an `order.created` message
- **`OrderFulfillmentProcessor`** subscribes to `order.created` and handles fulfillment
- **`OrderNotificationProcessor`** subscribes to the same topic and sends a confirmation

Both processors receive every message independently, demonstrating RunMQ's pub/sub model.

## Structure

```
src/
├── main.ts
├── app.module.ts              # Registers RunMQModule.forRoot()
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts   # POST /orders
│   ├── orders.service.ts      # Publishes order.created via RunMQPublisherService
│   └── dto/
│       └── create-order.dto.ts
├── fulfillment/
│   ├── fulfillment.module.ts
│   └── order-fulfillment.processor.ts   # @Processor — handles fulfillment
└── notifications/
    ├── notifications.module.ts
    └── order-notification.processor.ts  # @Processor — sends confirmation
```

## Running

**1. Start RabbitMQ**

```bash
docker compose up -d
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the app**

```bash
npm run start:dev
```

**4. Create an order**

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{ "item": "Laptop", "quantity": 1 }'
```

You'll see both processors log their output independently:

```
[OrderFulfillmentProcessor]  [Fulfillment] Processing order abc-123 — 1x Laptop
[OrderNotificationProcessor] [Notifications] Sending confirmation for order abc-123
[OrderFulfillmentProcessor]  [Fulfillment] Order abc-123 fulfilled
[OrderNotificationProcessor] [Notifications] Confirmation sent for order abc-123
```

The RabbitMQ management UI is available at **http://localhost:15672** (guest / guest).
