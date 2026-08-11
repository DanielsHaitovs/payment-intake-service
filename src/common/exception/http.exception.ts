import { HttpStatus } from '../enum/http-status.enum';

export class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(HttpStatus.NOT_FOUND, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Resource conflict') {
    super(HttpStatus.CONFLICT, message);
  }
}
