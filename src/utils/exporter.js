import * as XLSX from 'xlsx';
import { JUDGING_CONFIG, getCriteriaForCategory, getMaxScoreForCategory } from '../config/criteria';

/**
 * Export Competition Results to Excel Workbook
 * Sheets:
 * - "Solo Ranking"
 * - "Duo Ranking"
 * - "Trio Ranking"
 * - "Raw Scores & Comments"
 */
export function exportResultsToExcel({ entries, judges, scores, categoryStats }) {
  const wb = XLSX.utils.book_new();

  const categories = ['SOLO', 'DUO', 'TRIO'];

  // 1. Process each category sheet
  categories.forEach((cat) => {
    const catStats = categoryStats[cat] || [];
    const criteria = getCriteriaForCategory(cat);
    const maxScore = getMaxScoreForCategory(cat);

    const sheetData = catStats.map((item, index) => {
      const row = {
        'Rank': item.rank || index + 1,
        'Entry ID': item.entry.anonymousId,
        'Performer(s)': item.entry.displayName || 'Anonymous',
        'Primary Reg No': item.entry.primaryRegNo || '',
        'Average Total Score': Number((item.averageTotal || 0).toFixed(2)),
        'Max Possible': maxScore,
        'Judges Count': item.judgeCount || 0,
      };

      // Add per-criterion averages
      criteria.forEach((c) => {
        row[`Avg: ${c.name}`] = Number((item.criteriaAverages[c.id] || 0).toFixed(2));
      });

      // Add individual judge totals
      judges.forEach((j) => {
        const jScore = item.judgeScores.find((js) => js.judgeId === j.id);
        row[`Judge: ${j.name}`] = jScore ? Number(jScore.total.toFixed(1)) : 'N/A';
      });

      // Outlier warnings
      if (item.outliers && item.outliers.length > 0) {
        row['Outlier Notes'] = item.outliers.map((o) => `${o.judgeName} deviated ${Math.round(o.deviation * 100)}%`).join('; ');
      } else {
        row['Outlier Notes'] = 'None';
      }

      // Tie break note
      if (item.tieBreakReason) {
        row['Tie-Break Resolution'] = item.tieBreakReason;
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, `${cat} Ranking`);
  });

  // 2. Raw per-judge scores and comments sheet
  const rawData = [];
  const entriesMap = new Map(entries.map((e) => [e.id, e]));
  const judgesMap = new Map(judges.map((j) => [j.id, j]));

  scores.forEach((s) => {
    const entry = entriesMap.get(s.entryId);
    const judge = judgesMap.get(s.judgeId);
    if (!entry) return;

    const row = {
      'Category': entry.category,
      'Entry ID': entry.anonymousId,
      'Performer(s)': entry.displayName,
      'Judge Name': judge ? judge.name : 'Unknown Judge',
      'Submitted At': s.updatedAt ? new Date(s.updatedAt).toLocaleString() : '',
      'Total Score': Number((s.total || 0).toFixed(1)),
      'Comments / Feedback': s.comment || '',
    };

    // Add criteria scores
    JUDGING_CONFIG.criteria.forEach((crit) => {
      row[crit.name] = s.criteriaScores && s.criteriaScores[crit.id] !== undefined 
        ? s.criteriaScores[crit.id] 
        : '-';
    });

    rawData.push(row);
  });

  // Sort raw scores by category, entry ID, and judge
  rawData.sort((a, b) => {
    if (a.Category !== b.Category) return a.Category.localeCompare(b.Category);
    if (a['Entry ID'] !== b['Entry ID']) return a['Entry ID'].localeCompare(b['Entry ID']);
    return a['Judge Name'].localeCompare(b['Judge Name']);
  });

  const wsRaw = XLSX.utils.json_to_sheet(rawData);
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw Scores & Comments');

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Dance_Competition_Final_Results_${dateStr}.xlsx`);
}
