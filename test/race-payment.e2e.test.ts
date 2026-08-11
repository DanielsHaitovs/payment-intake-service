import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { randomUUID } from 'crypto';
import { HttpStatus } from '../src/common/enum/http-status.enum';

describe('POST /payments (e2e)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Race condition', () => {
    it('should handle concurrent requests with the same paymentId (prevent race condition)', async () => {
      const racePayload = {
        paymentId: randomUUID(),
        amount: 42.0,
        currency: 'EUR',
        debtorIban: 'LV97HABA0012345678910',
        creditorIban: 'LV12PARX0000000000001',
        reference: 'Race condition test',
      };

      const concurrentRequests = Array.from({ length: 500 }).map(() =>
        app.inject({
          method: 'POST',
          url: '/payments',
          headers: {
            'content-type': 'application/json',
          },
          payload: racePayload,
        }),
      );

      const responses = await Promise.all(concurrentRequests);

      const createdResponses = responses.filter((r) => r.statusCode === HttpStatus.CREATED);
      const conflictResponses = responses.filter((r) => r.statusCode === HttpStatus.CONFLICT);

      expect(createdResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(499);
    });
    it('should store the records in memory in a correct order based on the created at', async () => {
      const concurrentRequests = Array.from({ length: 500 }).map(() =>
        app.inject({
          method: 'POST',
          url: '/payments',
          headers: {
            'content-type': 'application/json',
          },
          payload: {
            paymentId: randomUUID(),
            amount: 42.0,
            currency: 'EUR',
            debtorIban: 'LV97HABA0012345678910',
            creditorIban: 'LV12PARX0000000000001',
            reference: 'Race condition test',
          },
        }),
      );

      const responses = await Promise.all(concurrentRequests);

      const createdResponses = responses.filter((r) => r.statusCode === HttpStatus.CREATED);
      const conflictResponses = responses.filter((r) => r.statusCode === HttpStatus.CONFLICT);

      expect(createdResponses.length).toBe(500);
      expect(conflictResponses.length).toBe(0);

      const getResponse = await app.inject({
        method: 'GET',
        url: '/payments',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(getResponse.statusCode).toBe(HttpStatus.OK);
      const payments = JSON.parse(getResponse.body).payments;
      expect(payments.length).toBe(501); // 500 new + 1 from previous test
      const sortedPayments = [...payments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      expect(payments).toEqual(sortedPayments);
    });
  });
});
