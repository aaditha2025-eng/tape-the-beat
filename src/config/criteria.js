/**
 * Dance Competition Judging Criteria Configuration
 * 
 * Edit criteria, categories, weights, or tie-break order here.
 */

export const JUDGING_CONFIG = {
  // Score constraints
  minScore: 1.0,
  maxScore: 10.0,
  scoreStep: 0.5,
  defaultScore: 5.0, // Initial slider position when opened

  // Outlier threshold (e.g. 0.20 = 20% variance from peer average)
  outlierThreshold: 0.20,

  // Criteria definitions
  criteria: [
    {
      id: 'expression_energy',
      name: 'Expression & Energy',
      description: 'Stage presence, facial expression, stamina, connection to audience & rhythm.',
      categories: ['SOLO', 'DUO', 'TRIO'],
      maxScore: 10,
    },
    {
      id: 'choreography',
      name: 'Creative Choreography',
      description: 'Originality, musicality, transitions, formation usage & thematic creativity.',
      categories: ['SOLO', 'DUO', 'TRIO'],
      maxScore: 10,
    },
    {
      id: 'precision_timing',
      name: 'Precision & Timing',
      description: 'Beat accuracy, clean lines, tempo synchronization & sharpness.',
      categories: ['SOLO', 'DUO', 'TRIO'],
      maxScore: 10,
    },
    {
      id: 'technique_execution',
      name: 'Technique & Execution',
      description: 'Dance posture, footwork cleanliness, control, balance & difficulty level.',
      categories: ['SOLO', 'DUO', 'TRIO'],
      maxScore: 10,
    },
    {
      id: 'overall_impact',
      name: 'Overall Impact',
      description: 'Overall impression, flow, costume/concept fit & memorability.',
      categories: ['SOLO', 'DUO', 'TRIO'],
      maxScore: 10,
    },
    {
      id: 'synchronization_chemistry',
      name: 'Synchronization & Chemistry',
      description: 'Partner coordination, mutual timing, spacing & visual synergy.',
      categories: ['DUO', 'TRIO'], // DUO and TRIO ONLY
      maxScore: 10,
    },
  ],

  // Category specific maximum scores
  categoryMaxScores: {
    SOLO: 50,  // 5 criteria * 10
    DUO: 60,   // 6 criteria * 10
    TRIO: 60,  // 6 criteria * 10
  },

  // Configurable tie-break priority rules
  tieBreakOrder: [
    {
      criterionId: 'technique_execution',
      name: 'Technique & Execution Average',
    },
    {
      criterionId: 'choreography',
      name: 'Creative Choreography Average',
    },
  ],
};

/**
 * Filter criteria that apply to a specific category
 */
export function getCriteriaForCategory(category) {
  const normCategory = (category || 'SOLO').toUpperCase();
  return JUDGING_CONFIG.criteria.filter((c) =>
    c.categories.includes(normCategory)
  );
}

/**
 * Calculate max possible score for a category
 */
export function getMaxScoreForCategory(category) {
  const normCategory = (category || 'SOLO').toUpperCase();
  return JUDGING_CONFIG.categoryMaxScores[normCategory] || 50;
}
