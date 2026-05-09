# nestjs-runmq

The official NestJS module for [RunMQ](https://github.com/runmq/queue) — a reliable, high-performance message queue for Node.js built on top of RabbitMQ.

This package gives you the full power of RunMQ with the NestJS developer experience you'd expect: decorator-based processors, an injectable publisher, automatic discovery, and a lifecycle that's wired into your app.

```bash
npm install nestjs-runmq runmq
```

---

## Quick Start

### 1. Register the module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RunMQModule } from 'nestjs-runmq';

@Module({
  imports: [
    RunMQModule.forRoot({
      url: 'amqp://guest:guest@localhost:5672',
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

`RunMQModule` is **global** — register it once and you can inject the publisher (or processors) anywhere. The connection is opened during bootstrap and closed gracefully on shutdown, so you don't need to manage it yourself.

### 2. Define a processor

A processor is just a regular `@Injectable()` class with two decorators on top: `@Processor()` to describe the queue, and `@ProcessMessage()` to mark the handler.

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
  usePoliciesForDelay: true,
})
@Injectable()
export class EmailProcessor {
  @ProcessMessage()
  async handle(message: RunMQMessageContent<{ email: string; name: string }>) {
    await sendWelcomeEmail(message.message.email, message.message.name);
  }
}
```

Register it as a provider in any module:

```typescript
@Module({ providers: [EmailProcessor] })
export class EmailModule {}
```

That's it. On startup, the explorer scans your providers, finds every `@Processor()`, and registers it with RunMQ. No manual wiring, no `forFeature()` boilerplate.

### 3. Publish from anywhere

```typescript
import { Injectable } from '@nestjs/common';
import { RunMQPublisherService } from 'nestjs-runmq';

@Injectable()
export class UserService {
  constructor(private readonly publisher: RunMQPublisherService) {}

  async createUser(email: string, name: string) {
    // ...persist user
    this.publisher.publish('user.created', { email, name });
  }
}
```

---

## Configuration

### `forRoot` — static config

```typescript
RunMQModule.forRoot({
  url: 'amqp://guest:guest@localhost:5672',
  reconnectDelay: 5000,         // ms between reconnect attempts (default: 5000)
  maxReconnectAttempts: 5,      // give up after N attempts (default: 5)
  management: {                 // optional, but highly recommended
    url: 'http://localhost:15672',
    username: 'guest',
    password: 'guest',
  },
})
```

> **Tip:** Providing the `management` block enables policy-based retry delays, which let you change `attemptsDelay` on the fly without re-declaring queues. See [Policy-based delays](#policy-based-retry-delays) below.

### `forRootAsync` — runtime config

Use this when your config lives in environment variables, a config service, or anywhere asynchronous.

**With a factory** (the common case with `@nestjs/config`):

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

RunMQModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    url: config.getOrThrow('RABBITMQ_URL'),
    management: {
      url: config.getOrThrow('RABBITMQ_MANAGEMENT_URL'),
      username: config.get('RABBITMQ_MANAGEMENT_USER', 'guest'),
      password: config.get('RABBITMQ_MANAGEMENT_PASS', 'guest'),
    },
  }),
})
```

**With a class** that implements `RunMQOptionsFactory`:

```typescript
import { Injectable } from '@nestjs/common';
import { RunMQOptionsFactory, RunMQModuleOptions } from 'nestjs-runmq';

@Injectable()
export class RabbitMQConfig implements RunMQOptionsFactory {
  createRunMQOptions(): RunMQModuleOptions {
    return { url: process.env.RABBITMQ_URL! };
  }
}

RunMQModule.forRootAsync({ useClass: RabbitMQConfig });
// or, to reuse an instance already provided elsewhere:
RunMQModule.forRootAsync({ useExisting: RabbitMQConfig });
```

---

## Processors in depth

### Anatomy of `@Processor()`

| Option | Type | Default | What it does |
|--------|------|---------|--------------|
| `topic` | `string` | — | The topic this processor subscribes to. |
| `name` | `string` | — | Unique processor name. Each name gets its own dedicated queue and DLQ. |
| `consumersCount` | `number` | `1` | How many messages this processor handles concurrently (RabbitMQ prefetch). |
| `attempts` | `number` | `1` | Maximum delivery attempts before a message goes to the DLQ. |
| `attemptsDelay` | `number` | `1000` | Milliseconds to wait between retries. |
| `usePoliciesForDelay` | `boolean` | `false` | Use RabbitMQ policies for the retry delay TTL. **Recommended.** |
| `messageSchema` | `MessageSchema` | — | Optional schema to validate incoming messages. |

Each `@Processor()` class must declare exactly **one** `@ProcessMessage()` method. The handler signature is:

```typescript
(message: RunMQMessageContent<T>) => Promise<void>
```

If the handler throws, RunMQ retries the message according to your `attempts` / `attemptsDelay`. After the last attempt, the message is moved to that processor's dedicated DLQ — other processors on the same topic are unaffected.

### Pub/Sub: many processors, one topic

Because each `@Processor()` has its own queue, you can fan out a single event to multiple independent handlers — each with its own retries, concurrency, and DLQ.

```typescript
@Processor({ topic: 'user.created', name: 'emailService', attempts: 3 })
@Injectable()
export class EmailProcessor {
  @ProcessMessage()
  async handle(msg: RunMQMessageContent<UserCreated>) { /* ... */ }
}

@Processor({ topic: 'user.created', name: 'analyticsService', attempts: 5 })
@Injectable()
export class AnalyticsProcessor {
  @ProcessMessage()
  async handle(msg: RunMQMessageContent<UserCreated>) { /* ... */ }
}
```

A single `publisher.publish('user.created', ...)` call delivers atomically to both queues — no need to publish twice.

### Schema validation

Pass a `messageSchema` to validate every message before it reaches your handler. Invalid messages are routed straight to the DLQ, so your business logic only ever sees well-formed data.

```typescript
@Processor({
  topic: 'order.placed',
  name: 'orderProcessor',
  attempts: 3,
  messageSchema: {
    type: 'ajv',
    failureStrategy: 'dlq',
    schema: {
      type: 'object',
      required: ['orderId', 'total'],
      properties: {
        orderId: { type: 'string', pattern: '^ORD-[0-9]+$' },
        total: { type: 'number', minimum: 0 },
      },
    },
  },
})
@Injectable()
export class OrderProcessor {
  @ProcessMessage()
  async handle(message: RunMQMessageContent<Order>) {
    // message.message is guaranteed to match the schema
  }
}
```

### Policy-based retry delays

When `usePoliciesForDelay: true` and the `management` config is provided, RunMQ uses RabbitMQ policies (instead of hard-coded queue TTLs) to control the retry delay. The practical benefit: you can change `attemptsDelay` later **without** deleting and recreating queues.

> 💡 **Tune retries from the dashboard.** With this combo enabled, [RunMQ Pulse](https://github.com/runmq/pulse) lets you adjust retry delays **dynamically, at runtime, straight from the UI** — no redeploys, no queue surgery. Hit a noisy hour in production? Bump the delay live, watch the queues drain, and dial it back when things settle.

If you only set one of the two, RunMQ falls back to the safe default (queue-based TTL).

---

## Publishing

### `RunMQPublisherService`

```typescript
publisher.publish(topic: string, message: Record<string, any>, correlationId?: string): void
```

- `topic` — the topic you're publishing to. Every processor subscribed to this topic receives the message.
- `message` — your payload. Make sure it satisfies any schemas the consumers expect.
- `correlationId` — optional. Useful for tracing a message across services.

If RunMQ isn't connected yet (e.g., you're publishing during `onModuleInit` before the app has fully booted), `publish` throws `RunMQ is not connected`. In practice, publish from inside request handlers or jobs — by then the connection is up.

---

## Logging

`nestjs-runmq` automatically pipes RunMQ's internal logs through NestJS's built-in `Logger` under the `RunMQ` context. That means:

- RunMQ's connection status, processor registration, retry attempts, and errors all appear in your normal NestJS logs.
- Anything you've configured globally (custom log levels, JSON formatting via a logger like `nestjs-pino`, log shipping, etc.) automatically applies to RunMQ output too.
- No extra adapter or boilerplate is needed — it's wired in for you.

Example output during startup:

```
[Nest] 12345  - RunMQ                    LOG Connected to amqp://localhost:5672
[Nest] 12345  - RunMQ                    LOG Processor "emailService" listening on user.created
```

If you swap NestJS's logger (e.g., `app.useLogger(...)`), RunMQ follows along automatically.

---

## Accessing the raw RunMQ instance

For advanced use cases — health checks, custom diagnostics, or features not yet exposed by this module — you can inject the underlying `RunMQ` client directly:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRunMQ } from 'nestjs-runmq';
import { RunMQ } from 'runmq';

@Injectable()
export class HealthService {
  constructor(@InjectRunMQ() private readonly runmq: RunMQ) {}

  rabbitmq() {
    return { connected: this.runmq.isActive() };
  }
}
```

---

## Error handling reference

| Scenario | Behavior |
|----------|----------|
| RabbitMQ unreachable at startup | Logged via NestJS Logger, error is re-thrown so bootstrap fails fast. |
| `publish()` before connection is ready | Throws `Error('RunMQ is not connected')`. |
| Two processors with the same `name` | Throws at startup: `Duplicate processor name: {name}`. |
| `@Processor` class missing `@ProcessMessage` | Throws at startup: `No @ProcessMessage handler found in {ClassName}`. |
| `@Processor` class with multiple `@ProcessMessage` methods | Throws at startup: `Multiple @ProcessMessage handlers in {ClassName}`. |

These are intentional fail-fast checks — they catch misconfiguration before a single message is processed.

---

## Re-exported types

For convenience, the most useful types from the `runmq` core package are re-exported here so you don't have to import from two places:

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

## Dashboard

Want to watch your queues, processors, and DLQs in real time? Pair this module with [RunMQ Pulse](https://github.com/runmq/pulse) — a web dashboard built specifically for RunMQ.

---

## License

MIT