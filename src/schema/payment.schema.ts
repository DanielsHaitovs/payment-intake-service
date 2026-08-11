import { z } from 'zod';

const ibanRegex = /^[A-Za-z]{2}[A-Za-z0-9]{13,32}$/;

export const createPaymentSchema = z.object({
  paymentId: z.string().trim().min(1, 'paymentId must be a non-empty string'),
  amount: z
    .number({ invalid_type_error: 'amount must be a number' })
    .positive('amount must be positive')
    .multipleOf(0.01, 'amount can have at most 2 decimal places'),
  currency: z.enum(['EUR', 'USD', 'GBP'], {
    errorMap: () => ({ message: 'currency must be EUR, USD, or GBP' }),
  }),
  debtorIban: z.string().trim().regex(ibanRegex, 'invalid debtorIban format'),
  creditorIban: z.string().trim().regex(ibanRegex, 'invalid creditorIban format'),
  reference: z.string().nullish(),
});
