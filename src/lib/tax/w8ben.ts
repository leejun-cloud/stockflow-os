import type { ContributorProfile } from '../domain';

export type W8BenFields = {
  name: string;
  countryOfCitizenship: string;
  permanentAddress: string;
  foreignTin: string;
  treatyCountry: string;
  treatyArticle: string;
  withholdingRate: number;
  incomeType: string;
  warnings: string[];
};

// Pure W-8BEN prefill. Korea treaty defaults are hardcoded from research
// (US–Korea income tax treaty, royalties for copyright/artistic works).
export function computeW8Ben(profile: ContributorProfile): W8BenFields {
  const warnings: string[] = [];
  const country = profile.identity.country;
  const foreignTin = profile.tax.foreignTin.trim();
  const legalName = profile.identity.legalNameFull.trim();

  let treatyCountry = '';
  let treatyArticle = '';
  let withholdingRate = 30;
  let incomeType = '';

  if (country === 'KR') {
    treatyCountry = 'Korea, Republic of';
    treatyArticle = 'Article 14';
    withholdingRate = 10;
    incomeType = 'Copyright/artistic royalties';
  } else {
    warnings.push(`No tax treaty defaults configured for country "${country}"; 30% withholding will apply.`);
  }

  if (!foreignTin) {
    withholdingRate = 30;
    warnings.push('Foreign TIN is missing; 30% withholding will apply.');
  }

  if (!legalName) warnings.push('Legal name is missing.');

  const addr = profile.address;
  const permanentAddress = [addr.line1, addr.line2, addr.city, addr.region, addr.postalCode, addr.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
  if (!permanentAddress) warnings.push('Permanent address is missing.');

  return {
    name: legalName,
    countryOfCitizenship: country,
    permanentAddress,
    foreignTin,
    treatyCountry,
    treatyArticle,
    withholdingRate,
    incomeType,
    warnings,
  };
}
