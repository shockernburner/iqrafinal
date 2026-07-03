export const IQRA_POLICY_VERSION = "2026-07-01.1";

export const CANONICAL_BASMALA =
  "بِسْمِ ٱللّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ Bismillāh al-Raḥmān al-Raḥīm (In the name of Allah, the Most Gracious, the Most Merciful)";

export const COMPARATIVE_RELIGION_REFUSAL =
  "I am dedicated to exploring and guiding you through Islamic principles, lifestyle, and ethics. I cannot provide information or comparisons regarding other faith traditions.";

const comparativeReligionPattern =
  /\b(christian|christianity|jewish|judaism|hindu|hinduism|buddhist|buddhism|secular philosophy|western ethics|other faith|another religion)\b/i;

const scholarReferralPattern =
  /\b(divorce|talaq|inheritance|mirath|estate|criminal|medical|diagnosis|fatwa|court|judge|custody|complex finance|derivative|bankruptcy)\b/i;

const prohibitedMechanismPattern = /\b(loophole|workaround|hide interest|avoid detection|fake invoice|deceptive|riba loophole)\b/i;

export type PolicyAssessment = {
  requiresComparativeReligionRefusal: boolean;
  requiresScholarReferral: boolean;
  prohibitsWorkaround: boolean;
};

export function assessIqraPolicy(prompt: string): PolicyAssessment {
  return {
    requiresComparativeReligionRefusal: comparativeReligionPattern.test(prompt),
    requiresScholarReferral: scholarReferralPattern.test(prompt),
    prohibitsWorkaround: prohibitedMechanismPattern.test(prompt),
  };
}
