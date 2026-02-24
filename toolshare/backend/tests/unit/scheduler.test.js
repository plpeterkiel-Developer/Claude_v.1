'use strict';

/**
 * Unit test for the overdue loan detection logic.
 * Uses a mock PrismaClient to avoid hitting a real database.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    request: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

jest.mock('../../src/services/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../../src/services/email');
const { checkOverdueLoans } = require('../../src/services/scheduler');

describe('checkOverdueLoans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks accepted requests with past end dates as overdue', async () => {
    const mockPrisma = new PrismaClient();

    const overdueRequest = {
      id: 'req-1',
      endDate: new Date('2025-01-01'),
      status: 'accepted',
      borrower: { id: 'user-1', email: 'borrower@example.com', name: 'Borrower', preferredLanguage: 'en' },
      tool: { id: 'tool-1', name: 'Lawnmower' },
    };

    mockPrisma.request.findMany.mockResolvedValue([overdueRequest]);
    mockPrisma.request.update.mockResolvedValue({ ...overdueRequest, status: 'overdue' });

    await checkOverdueLoans();

    expect(mockPrisma.request.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'accepted' }),
      })
    );
    expect(mockPrisma.request.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: { status: 'overdue' },
      })
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'borrower@example.com',
        templateKey: 'loanOverdue',
      })
    );
  });

  it('sends a reminder email to the borrower', async () => {
    const mockPrisma = new PrismaClient();
    const overdueRequest = {
      id: 'req-2',
      endDate: new Date('2025-01-05'),
      status: 'accepted',
      borrower: { id: 'user-2', email: 'borrower2@example.com', name: 'Alice', preferredLanguage: 'da' },
      tool: { id: 'tool-2', name: 'Spade' },
    };

    mockPrisma.request.findMany.mockResolvedValue([overdueRequest]);
    mockPrisma.request.update.mockResolvedValue({});

    await checkOverdueLoans();

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'loanOverdue',
        lang: 'da',
        templateArgs: expect.arrayContaining(['Alice', 'Spade']),
      })
    );
  });

  it('does nothing when there are no overdue loans', async () => {
    const mockPrisma = new PrismaClient();
    mockPrisma.request.findMany.mockResolvedValue([]);

    await checkOverdueLoans();

    expect(mockPrisma.request.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
