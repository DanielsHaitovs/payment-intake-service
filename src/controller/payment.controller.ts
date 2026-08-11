import { FastifyRequest, FastifyReply } from 'fastify';
import { HttpStatus } from '../common/enum/http-status.enum';
import { PaymentService } from '../service/payment.service';
import { createPaymentSchema } from '../schema/payment.schema';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createPayment = async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const parseResult = createPaymentSchema.parse(request.body);

    const payment = await this.paymentService.processPayment(parseResult);

    return reply.status(HttpStatus.CREATED).send(payment);
  };
}
