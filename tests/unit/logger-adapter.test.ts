import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestJSRunMQLogger } from '@src/logger-adapter';

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  })),
}));

describe('NestJSRunMQLogger', () => {
  let adapter: NestJSRunMQLogger;
  let mockLogger: {
    log: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new NestJSRunMQLogger();
    mockLogger = (Logger as unknown as jest.Mock).mock.results[0].value;
  });

  it('should create Logger with RunMQ context', () => {
    expect(Logger).toHaveBeenCalledWith('RunMQ');
  });

  it('should delegate log() to NestJS Logger.log()', () => {
    adapter.log('test message', 'extra');
    expect(mockLogger.log).toHaveBeenCalledWith('test message', 'extra');
  });

  it('should delegate error() to NestJS Logger.error()', () => {
    adapter.error('error message', 'trace');
    expect(mockLogger.error).toHaveBeenCalledWith('error message', 'trace');
  });

  it('should delegate warn() to NestJS Logger.warn()', () => {
    adapter.warn('warn message');
    expect(mockLogger.warn).toHaveBeenCalledWith('warn message');
  });

  it('should delegate info() to NestJS Logger.log()', () => {
    adapter.info('info message');
    expect(mockLogger.log).toHaveBeenCalledWith('info message');
  });

  it('should delegate debug() to NestJS Logger.debug()', () => {
    adapter.debug('debug message');
    expect(mockLogger.debug).toHaveBeenCalledWith('debug message');
  });

  it('should delegate verbose() to NestJS Logger.verbose()', () => {
    adapter.verbose('verbose message');
    expect(mockLogger.verbose).toHaveBeenCalledWith('verbose message');
  });
});
