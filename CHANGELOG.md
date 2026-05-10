# [2.0.0](https://github.com/runmq/nestjs/compare/v1.0.0...v2.0.0) (2026-05-10)


* feat!: make RunMQPublisherService.publish async (Promise<void>) ([7804b59](https://github.com/runmq/nestjs/commit/7804b5997c3a6c8f21f23811fb79b9fbdd45ded8))


### BREAKING CHANGES

* RunMQPublisherService.publish now returns Promise<void>
instead of void. Existing callers must await the call (or chain
.then/.catch) so broker rejections surface where you can act on them.
The "RunMQ is not connected" guard now rejects the returned promise
rather than throwing synchronously.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

# 1.0.0 (2026-03-02)


### Features

* add @runmq/nestjs module with decorator-based processors and publisher ([d973486](https://github.com/runmq/nestjs/commit/d973486b711545d5753f6878b73a997102522d5e))

# 1.0.0 (2026-03-02)


### Features

* add nestjs-runmq module with decorator-based processors and publisher ([d973486](https://github.com/runmq/nestjs/commit/d973486b711545d5753f6878b73a997102522d5e))
