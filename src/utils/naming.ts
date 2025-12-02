import type { SampleAnalysis } from '../types';

/** Generates filename prefix from sample analysis */
export const formatNamePrefix = (analysis: SampleAnalysis | undefined): string => {
  if (!analysis) return 'sample';

  if (analysis.type === 'drum_hit' && analysis.drumClass) {
    return analysis.drumClass;
  }

  if (analysis.type === 'melodic' && analysis.noteName) {
    return analysis.noteName.replace(/\s+/g, '');
  }

  return analysis.type === 'melodic' ? 'melodic' : 'sample';
};
