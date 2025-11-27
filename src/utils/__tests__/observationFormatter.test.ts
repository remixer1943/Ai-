import { describe, expect, it } from 'vitest';
import { highlightNarrativeWithEvidence, ensureEvidenceCoverage } from '../observationFormatter';

describe('observationFormatter', () => {
  const narrative = '孩子在0:10时把泡泡棒当画笔使用，并保持专注。';
  const evidences = ['泡泡棒当画笔使用', '保持专注'];

  it('highlights evidence phrases in narrative', () => {
    const highlighted = highlightNarrativeWithEvidence(narrative, evidences);
    expect(highlighted).toContain('<span');
    expect(highlighted).toContain('泡泡棒当画笔使用');
  });

  it('ensures all evidences exist in narrative', () => {
    expect(ensureEvidenceCoverage(narrative, evidences)).toBe(true);
    expect(ensureEvidenceCoverage(narrative, ['不存在'])).toBe(false);
  });
});
