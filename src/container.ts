import { InMemoryPaymentRepository } from './repository/payment.repository';
import { PaymentService } from './service/payment.service';
import { PaymentController } from './controller/payment.controller';

export interface AppContainer {
  paymentController: PaymentController;
}

export function buildContainer(): AppContainer {
  const paymentRepository = new InMemoryPaymentRepository();
  const paymentService = new PaymentService(paymentRepository);
  const paymentController = new PaymentController(paymentService);

  return {
    paymentController,
  };
}
