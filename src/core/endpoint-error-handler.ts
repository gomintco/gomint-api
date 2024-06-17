import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export function handleEndpointErrors(
  logger: Logger,
  error: any,
  errorMap: {
    errorTypes: any[];
    toThrow: new (message: string) => HttpException;
  }[],
  defaultThrow?: new (message: string) => HttpException,
) {
  logger.error(error);

  if (error instanceof HttpException) {
    throw error;
  }

  for (const { errorTypes, toThrow } of errorMap) {
    if (errorTypes.some((errorType) => error instanceof errorType)) {
      throw new toThrow(error.message);
    }
  }

  if (defaultThrow) {
    throw new defaultThrow(error.message);
  }

  throw new InternalServerErrorException(error.message);
}
