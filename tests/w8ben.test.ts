import { describe, expect, it } from 'vitest';
import type { ContributorProfile } from '../src/lib/domain';
import { computeW8Ben } from '../src/lib/tax/w8ben';

function koreaProfile(overrides: Partial<ContributorProfile['tax']> = {}): ContributorProfile {
  return {
    id: 'p1',
    userId: 'u1',
    identity: { legalNameFull: 'Hong Gildong', displayName: 'gildong', country: 'KR', phone: '01000000000' },
    address: { line1: '123 Test-ro', line2: '', city: 'Seoul', region: 'Seoul', postalCode: '04000', country: 'KR' },
    tax: { foreignTin: '123-45-67890', usTin: '', ...overrides },
    payment: { method: 'paypal', payoutEmail: 'gildong@example.com' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('computeW8Ben', () => {
  it('applies Korea treaty defaults', () => {
    const result = computeW8Ben(koreaProfile());
    expect(result.treatyCountry).toBe('Korea, Republic of');
    expect(result.treatyArticle).toBe('Article 14');
    expect(result.withholdingRate).toBe(10);
    expect(result.incomeType).toBe('Copyright/artistic royalties');
    expect(result.warnings).toHaveLength(0);
  });

  it('warns and forces 30% when foreign TIN is missing', () => {
    const result = computeW8Ben(koreaProfile({ foreignTin: '' }));
    expect(result.withholdingRate).toBe(30);
    expect(result.warnings).toContain('Foreign TIN is missing; 30% withholding will apply.');
  });
});
