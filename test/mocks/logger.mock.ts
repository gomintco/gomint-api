export function mockLogger() {
  jest.mock('@nestjs/common', () => {
    const original = jest.requireActual('@nestjs/common');
    return {
      ...original,
      Logger: Object.assign(
        jest.fn().mockImplementation(() => ({
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          verbose: jest.fn(),
        })),
        {
          // Static methods should be mocked separately
          overrideLogger: jest.fn(),
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          verbose: jest.fn(),
        },
      ),
    };
  });
}
