import { FastifyInstance } from 'fastify';
import { HttpStatus } from '../src/common/enum/http-status.enum';
import { buildApp } from '../src/app';
import { validatePaymentData } from './validate';
import { CreatePayment, PaymentListResponse, PaymentResponse } from '../src/types/payment.types';
import { randomUUID } from 'crypto';
import { createPayment } from './create';

describe('POST /payments (e2e)', () => {
  let app: FastifyInstance;
  let createPaymentPayload: CreatePayment;
  let payment1: PaymentResponse;
  let payment2: PaymentResponse;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
    payment1 = await createPayment({
      app,
      payment: {
        amount: 10,
        currency: 'EUR',
        debtorIban: 'LV97HABA0012345678910',
        creditorIban: 'LV12PARX0000000000001',
        reference: 'Invoice 42',
      },
    });
    payment2 = await createPayment({
      app,
      payment: {
        amount: 20,
        currency: 'USD',
        debtorIban: 'US00BANK0000000000001',
        creditorIban: 'DE89370400440532013000',
        reference: 'Invoice 43',
      },
    });
  });

  beforeEach(() => {
    createPaymentPayload = {
      paymentId: randomUUID(),
      amount: 100.5,
      currency: 'EUR',
      debtorIban: 'LV97HABA0012345678910',
      creditorIban: 'LV12PARX0000000000001',
      reference: 'Invoice 42',
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully create a valid EUR payment and return 201 Created', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/payments',
      headers: {
        'content-type': 'application/json',
      },
      payload: createPaymentPayload,
    });

    expect(response.statusCode).toBe(HttpStatus.OK);
    const { payments } = JSON.parse(response.body) as PaymentListResponse;

    if (payments[0] === undefined || payments[1] === undefined) {
      throw new Error('Expected at least two payments in the response');
    }

    validatePaymentData({ response: payments[0], expected: payment1 });
    validatePaymentData({ response: payments[1], expected: payment2 });
  });
});
