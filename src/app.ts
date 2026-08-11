import fastify, { FastifyError, FastifyInstance } from "fastify";
import { HttpStatus } from "./common/enum/http-status.enum";

export function buildApp(): FastifyInstance {
  const app = fastify({ logger: false });

  app.setErrorHandler((error: FastifyError | Error, _request, reply) => {
    const fastifyError = error as FastifyError;

    if (fastifyError.statusCode === HttpStatus.BAD_REQUEST) {
      return reply.status(HttpStatus.BAD_REQUEST).send({ error: 'Invalid payload' });
    }

    console.error('Unexpected error:', error);

    return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: 'Internal server error' });
  });


  // app.post('/payments', '');
  // app.get('/payments', '');

  return app;
}
