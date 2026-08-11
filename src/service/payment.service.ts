import { PaymentRepository } from '../repository/repository.interface';
import {
  CreatePayment,
  Payment,
  PaymentListResponse,
  PaymentResponse,
} from '../types/payment.types';

export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async processPayment(data: CreatePayment): Promise<PaymentResponse> {
    const saved = await this.repository.save(data);

    return this.mapToResponse(saved);
  }

  async getPayments(): Promise<PaymentListResponse> {
    const payments = await this.repository.findAll();

    return {
      payments: payments.map((payment) => this.mapToResponse(payment)),
    };
  }

  private mapToResponse(payment: Payment): PaymentResponse {
    return {
      id: payment.id,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      debtorIban: payment.debtorIban,
      creditorIban: payment.creditorIban,
      reference: payment.reference ?? null,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
