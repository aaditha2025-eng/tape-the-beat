import { JUDGING_CONFIG, getCriteriaForCategory, getMaxScoreForCategory } from '../config/criteria';

/**
 * Calculate Leaderboard Statistics for a category
 */
export function calculateCategoryLeaderboard({ category, entries, judges, scores }) {
  const normCategory = (category || 'SOLO').toUpperCase();
  const categoryEntries = entries.filter((e) => (e.category || 'SOLO').toUpperCase() === normCategory && !e.isExcluded);
  const criteria = getCriteriaForCategory(normCategory);
  const judgesMap = new Map(judges.map((j) => [j.id, j]));

  // Index scores by entryId
  const scoresByEntry = new Map();
  scores.forEach((s) => {
    if (!scoresByEntry.has(s.entryId)) {
      scoresByEntry.set(s.entryId, []);
    }
    scoresByEntry.get(s.entryId).push(s);
  });

  const entryStats = categoryEntries.map((entry) => {
    const entryScores = scoresByEntry.get(entry.id) || [];
    const judgeCount = entryScores.length;

    // Per-criterion sum & averages
    const criteriaSums = {};
    const criteriaAverages = {};
    criteria.forEach((c) => {
      criteriaSums[c.id] = 0;
      criteriaAverages[c.id] = 0;
    });

    const judgeTotals = [];

    entryScores.forEach((s) => {
      const judge = judgesMap.get(s.judgeId);
      const judgeName = judge ? judge.name : 'Unknown';
      let rowTotal = 0;

      criteria.forEach((c) => {
        const val = Number((s.criteriaScores && s.criteriaScores[c.id]) || 0);
        criteriaSums[c.id] += val;
        rowTotal += val;
      });

      judgeTotals.push({
        judgeId: s.judgeId,
        judgeName,
        total: rowTotal,
        comment: s.comment || '',
        updatedAt: s.updatedAt,
      });
    });

    let averageTotal = 0;
    if (judgeCount > 0) {
      criteria.forEach((c) => {
        criteriaAverages[c.id] = criteriaSums[c.id] / judgeCount;
      });
      const sumOfJudgeTotals = judgeTotals.reduce((acc, curr) => acc + curr.total, 0);
      averageTotal = sumOfJudgeTotals / judgeCount;
    }

    // Outlier Detection (warn when one judge differs from peer average by > 20%)
    const outliers = [];
    if (judgeTotals.length >= 3) {
      judgeTotals.forEach((curr, idx) => {
        const peers = judgeTotals.filter((_, i) => i !== idx);
        const peerAvg = peers.reduce((sum, p) => sum + p.total, 0) / peers.length;
        if (peerAvg > 0) {
          const deviation = Math.abs(curr.total - peerAvg) / peerAvg;
          if (deviation > (JUDGING_CONFIG.outlierThreshold || 0.20)) {
            outliers.push({
              judgeId: curr.judgeId,
              judgeName: curr.judgeName,
              total: curr.total,
              peerAvg: Number(peerAvg.toFixed(2)),
              deviation,
            });
          }
        }
      });
    }

    return {
      entry,
      judgeCount,
      judgeScores: judgeTotals,
      criteriaAverages,
      averageTotal,
      outliers,
      tieBreakReason: null,
      maxScore: getMaxScoreForCategory(normCategory),
    };
  });

  // Sort & Tie-Breaking
  entryStats.sort((a, b) => {
    // 1. Primary: Average Total Score descending
    const diff = b.averageTotal - a.averageTotal;
    if (Math.abs(diff) > 0.0001) return diff;

    // If both have 0 judges or equal total
    if (a.judgeCount === 0 && b.judgeCount === 0) return 0;
    if (a.judgeCount === 0) return 1;
    if (b.judgeCount === 0) return -1;

    // 2. Configurable tie-breakers
    for (const rule of JUDGING_CONFIG.tieBreakOrder) {
      const avgA = a.criteriaAverages[rule.criterionId] || 0;
      const avgB = b.criteriaAverages[rule.criterionId] || 0;
      const ruleDiff = avgB - avgA;
      if (Math.abs(ruleDiff) > 0.0001) {
        if (ruleDiff > 0) {
          b.tieBreakReason = `Resolved by higher ${rule.name} (${avgB.toFixed(1)} vs ${avgA.toFixed(1)})`;
        } else {
          a.tieBreakReason = `Resolved by higher ${rule.name} (${avgA.toFixed(1)} vs ${avgB.toFixed(1)})`;
        }
        return ruleDiff;
      }
    }

    // 3. Exact tie
    a.isTied = true;
    b.isTied = true;
    a.tieBreakReason = 'Exact Tie — Manual decision needed';
    b.tieBreakReason = 'Exact Tie — Manual decision needed';
    return 0;
  });

  // Assign visible ranks (handling ties properly: 1, 2, 2, 4...)
  let currentRank = 1;
  entryStats.forEach((item, index) => {
    if (index === 0) {
      item.rank = 1;
    } else {
      const prev = entryStats[index - 1];
      if (Math.abs(prev.averageTotal - item.averageTotal) < 0.0001 && item.isTied) {
        item.rank = prev.rank; // Same rank for exact ties
      } else {
        item.rank = index + 1;
      }
    }
  });

  return entryStats;
}
