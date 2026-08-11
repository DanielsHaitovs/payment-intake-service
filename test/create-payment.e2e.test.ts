import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { validatePaymentData } from './validate';
import { CreatePayment, PaymentResponse } from '../src/types/payment.types';
import { randomUUID } from 'crypto';
import { createPayment } from './create';
import { HttpStatus } from '../src/common/enum/http-status.enum';

describe('POST /payments (e2e)', () => {
  let app: FastifyInstance;
  let createPaymentPayload: CreatePayment;
  let conflictPayment: PaymentResponse;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
    conflictPayment = await createPayment({ app });
  });

  beforeEach(() => {
    createPaymentPayload = {
      paymentId: randomUUID(),
      amount: 1.14,
      currency: 'EUR',
      debtorIban: 'LV97HABA0012345678910',
      creditorIban: 'LV12PARX0000000000001',
      reference: 'Invoice 42',
    };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /payments - Valid payload scenarios', () => {
    it('should successfully create a valid EUR payment and return 201 Created', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload: createPaymentPayload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      validatePaymentData({ response: JSON.parse(response.body), expected: createPaymentPayload });
    });
    it('should successfully create a valid EUR (without reference) payment and return 201 Created', async () => {
      const payload: CreatePayment = {
        ...createPaymentPayload,
        reference: null,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      validatePaymentData({ response: JSON.parse(response.body), expected: payload });
    });
    it('should successfully create a valid payment (USD, foreign creditor) and return 201 Created', async () => {
      const payload: CreatePayment = {
        ...createPaymentPayload,
        currency: 'USD',
        amount: 250,
        creditorIban: 'DE89370400440532013000',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      validatePaymentData({ response: JSON.parse(response.body), expected: payload });
    });
  });
  it('Client retry, should return 409 Conflict when trying to create a payment with an existing paymentId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/payments',
      headers: {
        'content-type': 'application/json',
      },
      payload: {
        ...createPaymentPayload,
        paymentId: conflictPayment.paymentId,
      },
    });

    const body = response.json();
    expect(response.statusCode).toBe(HttpStatus.CONFLICT);
    expect(body.error).toEqual('Payment already exists.');
  });
  describe('POST /payments (400) - Invalid payload scenarios', () => {
    it('should throw 400 when amount is negative', async () => {
      const payload = {
        ...createPaymentPayload,
        amount: -100,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'amount',
          message: 'amount must be positive',
        },
      ]);
    });
    it('should throw 400 due to javascript floating point behavior ', async () => {
      const payload = {
        ...createPaymentPayload,
        amount: 0.14 * 100,
      };
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'amount',
          message: 'amount can have at most 2 decimal places',
        },
      ]);
    });
    it('should throw 400 when sending unsupported currency', async () => {
      const payload = {
        ...createPaymentPayload,
        currency: 'JPY',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'currency',
          message: 'currency must be EUR, USD, or GBP',
        },
      ]);
    });
    it('should throw 400 when amount has too many decimal places', async () => {
      const payload = {
        ...createPaymentPayload,
        amount: 10.999,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'amount',
          message: 'amount can have at most 2 decimal places',
        },
      ]);
    });
    it('should throw 400 when missing required fields', async () => {
      const payload = {
        paymentId: randomUUID(),
        amount: 10.99,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'currency',
          message: 'currency must be EUR, USD, or GBP',
        },
        {
          field: 'debtorIban',
          message: 'Required',
        },
        {
          field: 'creditorIban',
          message: 'Required',
        },
      ]);
    });
    it('should throw 400 when fields has wrong types', async () => {
      const payload = {
        ...createPaymentPayload,
        paymentId: randomUUID(),
        amount: 'ten',
        currency: 123,
        debtorIban: 456,
        creditorIban: 789,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'amount',
          message: 'amount must be a number',
        },
        {
          field: 'currency',
          message: 'currency must be EUR, USD, or GBP',
        },
        {
          field: 'debtorIban',
          message: 'Expected string, received number',
        },
        {
          field: 'creditorIban',
          message: 'Expected string, received number',
        },
      ]);
    });
    it('should throw 400 when payment id is empty', async () => {
      const payload = {
        ...createPaymentPayload,
        paymentId: '',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'paymentId',
          message: 'paymentId must be a non-empty string',
        },
      ]);
    });
    it('should return 400 when body contains broken/malformed JSON', async () => {
      const brokenJsonPayload = '{ "paymentId": "11111111-1111';

      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload: brokenJsonPayload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.error).toEqual('Invalid payload');
    });
  });
  describe('POST /payments - Invalid debtorIban scenarios', () => {
    const basePayload = {
      paymentId: '11111111-1111-1111-1111-111111111111',
      amount: 100.5,
      currency: 'EUR',
      creditorIban: 'LV12PARX0000000000001',
      reference: 'Invoice 42',
    };

    it.each([
      ['starts with numbers instead of 2 letters', '1297HABA0012345678910'],
      ['is too short (less than 15 chars)', 'LV12345'],
      ['is too long (more than 34 chars)', 'LV97HABA0012345678910123456789012345'],
      ['contains special characters/spaces', 'LV97-HABA-0012345678910'],
      ['is empty string', ''],
    ])('should return 400 when debtorIban %s', async (_description, invalidIban) => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          ...basePayload,
          debtorIban: invalidIban,
        },
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'debtorIban',
          message: 'invalid debtorIban format',
        },
      ]);
    });

    it('should return 400 when debtorIban field is missing completely', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
        payload: basePayload,
      });

      const body = response.json();
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.details).toEqual([
        {
          field: 'debtorIban',
          message: 'Required',
        },
      ]);
    });
  });
});
