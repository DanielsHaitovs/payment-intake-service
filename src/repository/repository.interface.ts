import { Payment, CreatePayment } from '../types/payment.types';

export interface PaymentRepository {
  save(paymentData: CreatePayment): Promise<Payment>;
  findAll(): Promise<Payment[]>;
}
