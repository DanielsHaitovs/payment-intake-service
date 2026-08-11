import { Payment, CreatePayment } from '../types/payment.types';
import { randomUUID } from 'crypto';
import { ConflictException } from '../common/exception/http.exception';
import { PaymentRepository } from './repository.interface';

export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly store = new Map<string, Payment>();

  async save(paymentData: CreatePayment): Promise<Payment> {
    if (!(await this.isUniquePaymentId(paymentData.paymentId))) {
      throw new ConflictException('Payment already exists.');
    }

    const payment: Payment = {
      ...paymentData,
      reference: paymentData.reference ?? null,
      id: randomUUID(),
      createdAt: new Date(),
    };

    this.store.set(paymentData.paymentId, payment);
    return payment;
  }

  private async isUniquePaymentId(paymentId: string): Promise<boolean> {
    return !this.store.has(paymentId);
  }

  async findAll(): Promise<Payment[]> {
    return Array.from(this.store.values());
  }
}
