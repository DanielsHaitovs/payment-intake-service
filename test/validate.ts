import { CreatePayment, PaymentResponse } from '../src/types/payment.types';

export function validatePaymentData({
  response,
  expected,
}: {
  response: PaymentResponse;
  expected: CreatePayment;
}): void {
  expect(response.paymentId).toBe(expected.paymentId);
  expect(response.amount).toBe(expected.amount);
  expect(response.currency).toBe(expected.currency);
  expect(response.debtorIban).toBe(expected.debtorIban);
  expect(response.creditorIban).toBe(expected.creditorIban);
  expect(response.reference).toBe(expected.reference ?? null);
  expect(response.id).toBeDefined();
}
