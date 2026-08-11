import { Payment, CreatePayment } from '../types/payment.types';

export interface PaymentRepository {
  save(paymentData: CreatePayment): Promise<Payment>;
  findByClientPaymentId(paymentId: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
}
