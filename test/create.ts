import { FastifyInstance } from 'fastify';
import { validatePaymentData } from './validate';
import { randomUUID } from 'crypto';
import { CreatePayment, PaymentResponse } from '../src/types/payment.types';

export async function createPayment(
  { app, payment }: { app: FastifyInstance; payment?: Partial<CreatePayment> },
): Promise<PaymentResponse> {
  const payload: CreatePayment = {
    paymentId: randomUUID(),
    amount: 100.5,
    currency: 'EUR',
    debtorIban: 'LV97HABA0012345678910',
    creditorIban: 'LV12PARX0000000000001',
    reference: 'Invoice 42',
    ...payment,
  };

  const result = await app.inject({
    method: 'POST',
    url: '/payments',
    headers: {
      'content-type': 'application/json',
    },
    payload,
  });

  expect(result.statusCode).toBe(201);

  const response = JSON.parse(result.body);

  validatePaymentData({ response, expected: payload });

  return response;
}
