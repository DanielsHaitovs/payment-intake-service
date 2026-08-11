import { PaymentService } from './payment.service';
import { PaymentRepository } from '../repository/repository.interface';
import { CreatePayment, Payment } from '../types/payment.types';
import { randomUUID, UUID } from 'crypto';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockRepository: jest.Mocked<PaymentRepository>;
  let mockInternalId: UUID;
  const reference = 'Invoice 12345';

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<PaymentRepository>;

    paymentService = new PaymentService(mockRepository);
    mockInternalId = randomUUID();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should successfully process a payment and return the mapped response', async () => {
      const createData: CreatePayment = {
        paymentId: 'ext-123',
        amount: 250.5,
        currency: 'EUR',
        debtorIban: 'LV12HABA1234567890123',
        creditorIban: 'LV98HABA9876543210987',
        reference,
      };

      const savedPayment: Payment = {
        ...createData,
        id: mockInternalId,
        reference,
        createdAt: new Date('2026-08-11T10:00:00Z'),
      };

      mockRepository.save.mockResolvedValue(savedPayment);

      const result = await paymentService.processPayment(createData);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        id: mockInternalId,
        paymentId: 'ext-123',
        amount: 250.5,
        currency: 'EUR',
        debtorIban: 'LV12HABA1234567890123',
        creditorIban: 'LV98HABA9876543210987',
        reference: 'Invoice 12345',
        createdAt: savedPayment.createdAt,
      });
    });

    it('should map the reference to null if it is missing or undefined', async () => {
      const createData: CreatePayment = {
        paymentId: 'ext-456',
        amount: 100,
        currency: 'USD',
        debtorIban: 'LV12HABA1234567890123',
        creditorIban: 'LV98HABA9876543210987',
      };

      const savedPayment: Payment = {
        ...createData,
        id: mockInternalId,
        reference: null,
        createdAt: new Date('2026-08-11T10:00:00Z'),
      };

      mockRepository.save.mockResolvedValue(savedPayment);

      const result = await paymentService.processPayment(createData);

      expect(result.reference).toBeNull();
    });

    it('should throw an error if the repository save fails', async () => {
      const createData: CreatePayment = {
        paymentId: 'ext-789',
        amount: 50,
        currency: 'GBP',
        debtorIban: 'LV12HABA1234567890123',
        creditorIban: 'LV98HABA9876543210987',
      };

      mockRepository.save.mockRejectedValue(new Error('Database failure'));
      await expect(paymentService.processPayment(createData)).rejects.toThrow('Database failure');
    });
  });
});
