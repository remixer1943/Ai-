export const highlightNarrativeWithEvidence = (narrative: string, evidences: string[]): string => {
  if (!narrative) return '';
  const uniqueEvidence = Array.from(new Set(evidences.filter(Boolean)));
  if (uniqueEvidence.length === 0) {
    return narrative;
  }

  let content = narrative;
  uniqueEvidence
    .sort((a, b) => b.length - a.length)
    .forEach((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'g');
      content = content.replace(
        regex,
        '<span class="bg-yellow-200 dark:bg-yellow-800/60 rounded px-1 py-0.5 border-b border-yellow-400">$1</span>'
      );
    });

  return content;
};

export const ensureEvidenceCoverage = (narrative: string, evidences: string[]): boolean => {
  if (!narrative || evidences.length === 0) return false;
  return evidences.every((phrase) => narrative.includes(phrase));
};
