import { extractTransaction } from '../lib/gemini';

describe('Transaction Extraction', () => {
  // Sample 1: Standard format
  test('should parse Sample 1 - Starbucks transaction', async () => {
    const text = `Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50`;

    const result = await extractTransaction(text);

    expect(result.description.toLowerCase()).toContain('starbucks');
    expect(result.amount).toBeLessThan(0); // Debit
    expect(result.balance).toBeCloseTo(18420.50, 0);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.date).toBeInstanceOf(Date);
  });

  // Sample 2: Alternative format
  test('should parse Sample 2 - Uber ride transaction', async () => {
    const text = `Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50`;

    const result = await extractTransaction(text);

    expect(result.description.toLowerCase()).toContain('uber');
    expect(result.amount).toBeLessThan(0); // Debited
    expect(result.balance).toBeCloseTo(17170.50, 0);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  // Sample 3: Messy format
  test('should parse Sample 3 - Messy Amazon transaction', async () => {
    const text = `txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping`;

    const result = await extractTransaction(text);

    expect(result.description.toLowerCase()).toContain('amazon');
    expect(result.amount).toBeLessThan(0); // Dr = Debit
    expect(result.balance).toBeCloseTo(14171.50, 0);
    expect(result.category?.toLowerCase()).toContain('shopping');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
