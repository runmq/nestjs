import type { RabbitMQManagementConfig } from 'runmq';

export interface RunMQModuleOptions {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  management?: RabbitMQManagementConfig;
}

export interface RunMQOptionsFactory {
  createRunMQOptions(): RunMQModuleOptions | Promise<RunMQModuleOptions>;
}
