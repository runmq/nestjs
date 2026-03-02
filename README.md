# nestjs-runmq

NestJS module for [RunMQ](https://github.com/runmq/queue) — decorator-based message processors, an injectable publisher service, and automatic lifecycle management.

## Installation

```bash
npm install nestjs-runmq runmq
```

---

## Quick Start

### 1. Register the Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RunMQModule } from 'nestjs-runmq';

@Module({
  imports: [
    RunMQModule.forRoot({
      url: 'amqp://guest:guest@localhost:5672',
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      management: {
        url: 'http://localhost:15672',
        username: 'guest',
        password: 'guest',
      },
    }),
  ],
})
export class AppModule {}
```

RunMQ connects automatically when the app starts and disconnects cleanly on shutdown.

---

### 2. Create a Processor

Decorate a class with `@Processor()` and mark the handler method with `@ProcessMessage()`:

```typescript
// email.processor.ts
import { Injectable } from '@nestjs/common';
import { Processor, ProcessMessage, RunMQMessageContent } from 'nestjs-runmq';

@Processor({
  topic: 'user.created',
  name: 'emailService',
  consumersCount: 2,
  attempts: 3,
  attemptsDelay: 2000,
})
@Injectable()
export class EmailProcessor {
  @ProcessMessage()
  async handle(message: RunMQMessageContent<{ email: string; name: string }>) {
    console.log(`Sending welcome email to ${message.message.email}`);
  }
}
```

Register it as a provider in any module:

```typescript
@Module({
  providers: [EmailProcessor],
})
export class EmailModule {}
```

The processor is discovered and registered automatically on startup — no manual wiring needed.

---

### 3. Publish Messages

Inject `RunMQPublisherService` anywhere in your app:

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { RunMQPublisherService } from 'nestjs-runmq';

@Injectable()
export class UserService {
  constructor(private readonly publisher: RunMQPublisherService) {}

  async createUser(email: string, name: string) {
    // ... save user
    this.publisher.publish('user.created', { email, name });
  }
}
```

---

## Configuration

### Static (`forRoot`)

```typescript
RunMQModule.forRoot({
  url: 'amqp://guest:guest@localhost:5672',
  reconnectDelay: 5000,        // Optional, default: 5000ms
  maxReconnectAttempts: 5,     // Optional, default: 5
  management: {                // Optional, enables policy-based TTL
    url: 'http://localhost:15672',
    username: 'guest',
    password: 'guest',
  },
})
```

### Async (`forRootAsync`)

Load configuration at runtime — e.g., from environment variables via `@nestjs/config`:

```typescript
// app.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config';

RunMQModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    url: config.get('RABBITMQ_URL'),
    reconnectDelay: config.get('RABBITMQ_RECONNECT_DELAY', 5000),
    maxReconnectAttempts: config.get('RABBITMQ_MAX_RECONNECT_ATTEMPTS', 5),
    management: {
      url: config.get('RABBITMQ_MANAGEMENT_URL'),
      username: config.get('RABBITMQ_MANAGEMENT_USER', 'guest'),
      password: config.get('RABBITMQ_MANAGEMENT_PASS', 'guest'),
    },
  }),
})
```

#### `useClass`

```typescript
import { Injectable } from '@nestjs/common';
import { RunMQOptionsFactory, RunMQModuleOptions } from 'nestjs-runmq';

@Injectable()
export class RabbitMQConfig implements RunMQOptionsFactory {
  createRunMQOptions(): RunMQModuleOptions {
    return {
      url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
      reconnectDelay: 5000,
      maxReconnectAttempts: 5,
      management: {
        url: process.env.RABBITMQ_MANAGEMENT_URL ?? 'http://localhost:15672',
        username: process.env.RABBITMQ_MANAGEMENT_USER ?? 'guest',
        password: process.env.RABBITMQ_MANAGEMENT_PASS ?? 'guest',
      },
    };
  }
}

RunMQModule.forRootAsync({ useClass: RabbitMQConfig })
```

#### `useExisting`

```typescript
RunMQModule.forRootAsync({ useExisting: RabbitMQConfig })
```

---

## Decorators

### `@Processor(options)`

Class-level decorator. Marks a class as a RunMQ message processor.

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `topic` | `string` | Yes | — | Topic to subscribe to |
| `name` | `string` | Yes | — | Unique processor name (creates an isolated queue) |
| `consumersCount` | `number` | No | `1` | Concurrent consumers |
| `attempts` | `number` | No | `1` | Max retry attempts |
| `attemptsDelay` | `number` | No | `1000` | Milliseconds between retries |
| `messageSchema` | `MessageSchema` | No | — | Optional JSON schema validation |
| `usePoliciesForDelay` | `boolean` | No | `false` | Use RabbitMQ policies for delay queues (recommended) |

### `@ProcessMessage()`

Method-level decorator. Marks which method handles incoming messages. Exactly **one** method per `@Processor` class must be decorated.

**Method signature**: `(message: RunMQMessageContent<T>) => Promise<void>`

### `@InjectRunMQ()`

Parameter decorator. Injects the raw `RunMQ` instance for advanced use cases:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRunMQ } from 'nestjs-runmq';
import { RunMQ } from 'runmq';

@Injectable()
export class HealthService {
  constructor(@InjectRunMQ() private readonly runmq: RunMQ) {}

  check() {
    return { rabbitmq: this.runmq.isActive() };
  }
}
```

---

## Injectable Services

### `RunMQPublisherService`

| Method | Signature | Description |
|--------|-----------|-------------|
| `publish` | `(topic: string, message: Record<string, any>, correlationId?: string) => void` | Publishes a message to the given topic |

Throws `'RunMQ is not connected'` if called before the connection is established.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| RabbitMQ unreachable at startup | Logged via NestJS Logger, error is re-thrown |
| `publish()` before connection | Throws `Error('RunMQ is not connected')` |
| Duplicate `@Processor` name | Throws at startup: `Duplicate processor name: {name}` |
| No `@ProcessMessage` in a `@Processor` class | Throws at startup: `No @ProcessMessage handler found in {ClassName}` |
| Multiple `@ProcessMessage` in one class | Throws at startup: `Multiple @ProcessMessage handlers in {ClassName}` |

---

## Re-exported Types

The following types from `runmq` are re-exported for convenience:

```typescript
import {
  RunMQMessageContent,
  RunMQMessageMetaContent,
  RunMQConnectionConfig,
  RunMQProcessorConfiguration,
  MessageSchema,
  SchemaType,
  SchemaFailureStrategy,
  RabbitMQManagementConfig,
  RunMQLogger,
  RunMQ,
} from 'nestjs-runmq';
```

---

## Full Example

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RunMQModule } from 'nestjs-runmq';
import { EmailModule } from './email/email.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    RunMQModule.forRoot({
      url: 'amqp://guest:guest@localhost:5672',
      reconnectDelay: 5000,
      maxReconnectAttempts: 5,
      management: {
        url: 'http://localhost:15672',
        username: 'guest',
        password: 'guest',
      },
    }),
    EmailModule,
    UserModule,
  ],
})
export class AppModule {}
```

```typescript
// email/email.processor.ts
import { Injectable } from '@nestjs/common';
import { Processor, ProcessMessage, RunMQMessageContent } from 'nestjs-runmq';

@Processor({ topic: 'user.created', name: 'emailService', consumersCount: 2, attempts: 3 })
@Injectable()
export class EmailProcessor {
  @ProcessMessage()
  async handle(message: RunMQMessageContent<{ email: string; name: string }>) {
    console.log(`Sending welcome email to ${message.message.email}`);
  }
}
```

```typescript
// email/email.module.ts
import { Module } from '@nestjs/common';
import { EmailProcessor } from './email.processor';

@Module({ providers: [EmailProcessor] })
export class EmailModule {}
```

```typescript
// user/user.service.ts
import { Injectable } from '@nestjs/common';
import { RunMQPublisherService } from 'nestjs-runmq';

@Injectable()
export class UserService {
  constructor(private readonly publisher: RunMQPublisherService) {}

  async createUser(email: string, name: string) {
    this.publisher.publish('user.created', { email, name });
  }
}
```

---

## Dashboard

Monitor your queues, processors, and messages in real time with [RunMQ Pulse](https://github.com/runmq/pulse).

---

## License

MIT
