import type { UUID } from 'crypto';
import type { createPaymentSchema } from '../schema/payment.schema';
import { z } from 'zod';

export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

export interface Payment {
  id: UUID;
  paymentId: string;
  amount: number;
  currency: CurrencyCode;
  debtorIban: string;
  creditorIban: string;
  reference: string | null;
  createdAt: Date;
}

export type CreatePayment = z.infer<typeof createPaymentSchema>;

export interface PaymentResponse extends Omit<Payment, 'createdAt' | 'id'> {
  id: string;
  createdAt: string;
}
