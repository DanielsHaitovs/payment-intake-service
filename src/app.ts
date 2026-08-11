import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import { HttpException } from './common/exception/http.exception';
import { ZodError } from 'zod';
import { HttpStatus } from './common/enum/http-status.enum';
import { buildContainer } from './container';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.setErrorHandler((error: FastifyError | ZodError | Error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(HttpStatus.BAD_REQUEST).send({
        error: 'Bad Request',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    if (error instanceof HttpException) {
      return reply.status(error.statusCode).send({
        error: error.message,
      });
    }

    const fastifyError = error as FastifyError;

    if (fastifyError.statusCode === 400) {
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    console.error({ err: error.message }, 'Unexpected error');

    return reply.status(500).send({ error: 'Internal server error' });
  });

  const container = buildContainer();

  app.post('/payments', container.paymentController.createPayment);
  // app.get('/payments', '');

  return app;
}
