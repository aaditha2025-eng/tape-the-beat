/**
 * Pre-configured Realistic Demo Dataset
 * 6 Entries: 2 Solo, 2 Duo, 2 Trio
 * 3 Renowned Fake Judges with real sample scores, comments, and working video embeds
 */

export const DEMO_JUDGES = [
  {
    id: 'judge_remo',
    name: "Remo D'Souza",
    token: 'remo-dance-pro-789a2b',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'judge_terence',
    name: 'Terence Lewis',
    token: 'terence-contemporary-541c9e',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'judge_geeta',
    name: 'Geeta Kapur',
    token: 'geeta-bollywood-982d1f',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_ENTRIES = [
  // SOLO ENTRIES
  {
    id: 'S-01',
    anonymousId: 'S-01',
    category: 'SOLO',
    displayName: 'AARAV SHARMA',
    primaryRegNo: '24BCE1024',
    primaryPhone: '9845123456',
    primaryEmail: 'aarav.sharma2024@college.edu',
    mainVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Standard embeddable video
    videoLinks: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    performers: [
      { name: 'AARAV SHARMA', regNo: '24BCE1024', phone: '9845123456', email: 'aarav.sharma2024@college.edu' }
    ],
    flags: [],
    isFlagged: false,
    isDuplicate: false,
    isExcluded: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'S-02',
    anonymousId: 'S-02',
    category: 'SOLO',
    displayName: 'ANANYA IYER',
    primaryRegNo: '25BIT1090',
    primaryPhone: '9712345678',
    primaryEmail: 'ananya.iyer2025@college.edu',
    mainVideo: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view', // Sample Google Drive link
    videoLinks: ['https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view'],
    performers: [
      { name: 'ANANYA IYER', regNo: '25BIT1090', phone: '9712345678', email: 'ananya.iyer2025@college.edu' }
    ],
    flags: [],
    isFlagged: false,
    isDuplicate: false,
    isExcluded: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },

  // DUO ENTRIES
  {
    id: 'D-01',
    anonymousId: 'D-01',
    category: 'DUO',
    displayName: 'ROHAN VERMA & MEERA NAIR',
    primaryRegNo: '23BME1145',
    primaryPhone: '9988776655',
    primaryEmail: 'rohan.verma2023@college.edu',
    mainVideo: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    videoLinks: ['https://www.youtube.com/watch?v=kJQP7kiw5Fk'],
    performers: [
      { name: 'ROHAN VERMA', regNo: '23BME1145', phone: '9988776655', email: 'rohan.verma2023@college.edu' },
      { name: 'MEERA NAIR', regNo: '23BCS1802', phone: '9988776656', email: 'meera.nair2023@college.edu' },
    ],
    flags: [],
    isFlagged: false,
    isDuplicate: false,
    isExcluded: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'D-02',
    anonymousId: 'D-02',
    category: 'DUO',
    displayName: 'KABIR DAS & ZARA KHAN',
    primaryRegNo: '24BEC1402',
    primaryPhone: '9822334455',
    primaryEmail: 'kabir.das2024@college.edu',
    mainVideo: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    videoLinks: ['https://www.youtube.com/watch?v=L_LUpnjgPso'],
    performers: [
      { name: 'KABIR DAS', regNo: '24BEC1402', phone: '9822334455', email: 'kabir.das2024@college.edu' },
      { name: 'ZARA KHAN', regNo: '24BEE1040', phone: '9822334456', email: 'zara.khan2024@college.edu' },
    ],
    flags: [],
    isFlagged: false,
    isDuplicate: false,
    isExcluded: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },

  // TRIO ENTRIES
  {
    id: 'T-01',
    anonymousId: 'T-01',
    category: 'TRIO',
    displayName: 'ARJUN REDDY & SNEHA PATEL & VIKRAM SEN',
    primaryRegNo: '22BCSE101',
    primaryPhone: '9123456780',
    primaryEmail: 'arjun.reddy2022@college.edu',
    mainVideo: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    videoLinks: ['https://www.youtube.com/watch?v=fJ9rUzIMcZQ'],
    performers: [
      { name: 'ARJUN REDDY', regNo: '22BCSE101', phone: '9123456780', email: 'arjun.reddy2022@college.edu' },
      { name: 'SNEHA PATEL', regNo: '22BEE1089', phone: '9123456781', email: 'sneha.patel2022@college.edu' },
      { name: 'VIKRAM SEN', regNo: '22BIT1044', phone: '9123456782', email: 'vikram.sen2022@college.edu' },
    ],
    flags: [],
    isFlagged: false,
    isDuplicate: false,
    isExcluded: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'T-02',
    anonymousId: 'T-02',
    category: 'TRIO',
    displayName: 'TANVI JOSHI & ADITYA RAO & POOJA MENON',
    primaryRegNo: '23BCE2091',
    primaryPhone: '9345678901',
    primaryEmail: 'tanvi.joshi2023@college.edu',
    mainVideo: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    videoLinks: ['https://www.youtube.com/watch?v=9bZkp7q19f0'],
    performers: [
      { name: 'TANVI JOSHI', regNo: '23BCE2091', phone: '9345678901', email: 'tanvi.joshi2023@college.edu' },
      { name: 'ADITYA RAO', regNo: '23BME1002', phone: '9345678902', email: 'aditya.rao2023@college.edu' },
      { name: 'POOJA MENON', regNo: '23BEC1201', phone: '9345678903', email: 'pooja.menon2023@college.edu' },
    ],
    flags: [],
    isFlagged: false,
    isDuplicate: false,
    isExcluded: false,
    createdAt: new Date().toISOString(),
  },
];

export const DEMO_SCORES = [
  // S-01 Scores (Aarav Sharma) - Solo max 50
  {
    judgeId: 'judge_remo',
    entryId: 'S-01',
    total: 44.5,
    criteriaScores: {
      expression_energy: 9.0,
      choreography: 9.0,
      precision_timing: 8.5,
      technique_execution: 9.0,
      overall_impact: 9.0,
    },
    comment: 'Incredible energy! Fantastic isolations and musicality throughout.',
    updatedAt: new Date(Date.now() - 1800000 * 3).toISOString(),
  },
  {
    judgeId: 'judge_terence',
    entryId: 'S-01',
    total: 42.0,
    criteriaScores: {
      expression_energy: 8.5,
      choreography: 8.5,
      precision_timing: 8.0,
      technique_execution: 8.5,
      overall_impact: 8.5,
    },
    comment: 'Clean footwork. Could work on breathing control during fast transitions.',
    updatedAt: new Date(Date.now() - 1800000 * 2).toISOString(),
  },
  {
    judgeId: 'judge_geeta',
    entryId: 'S-01',
    total: 46.0,
    criteriaScores: {
      expression_energy: 9.5,
      choreography: 9.5,
      precision_timing: 9.0,
      technique_execution: 9.0,
      overall_impact: 9.0,
    },
    comment: 'Pure joy to watch! True performer presence.',
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },

  // S-02 Scores (Ananya Iyer) - Solo max 50
  {
    judgeId: 'judge_remo',
    entryId: 'S-02',
    total: 40.5,
    criteriaScores: {
      expression_energy: 8.0,
      choreography: 8.5,
      precision_timing: 8.0,
      technique_execution: 8.0,
      overall_impact: 8.0,
    },
    comment: 'Very graceful expressions. Nice contemporary fusion.',
    updatedAt: new Date(Date.now() - 900000 * 3).toISOString(),
  },
  {
    judgeId: 'judge_terence',
    entryId: 'S-02',
    total: 45.0,
    criteriaScores: {
      expression_energy: 9.0,
      choreography: 9.0,
      precision_timing: 9.0,
      technique_execution: 9.5,
      overall_impact: 8.5,
    },
    comment: 'Exceptional technical precision and lines. Outstanding extensions.',
    updatedAt: new Date(Date.now() - 900000 * 2).toISOString(),
  },
  {
    judgeId: 'judge_geeta',
    entryId: 'S-02',
    total: 41.5,
    criteriaScores: {
      expression_energy: 8.5,
      choreography: 8.0,
      precision_timing: 8.5,
      technique_execution: 8.5,
      overall_impact: 8.0,
    },
    comment: 'Beautiful mudras and emotional depth.',
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },

  // D-01 Scores (Duo max 60)
  {
    judgeId: 'judge_remo',
    entryId: 'D-01',
    total: 54.0,
    criteriaScores: {
      expression_energy: 9.0,
      choreography: 9.0,
      precision_timing: 9.0,
      technique_execution: 9.0,
      overall_impact: 9.0,
      synchronization_chemistry: 9.0,
    },
    comment: 'Superb synchronization! You danced as one body.',
    updatedAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    judgeId: 'judge_terence',
    entryId: 'D-01',
    total: 51.5,
    criteriaScores: {
      expression_energy: 8.5,
      choreography: 9.0,
      precision_timing: 8.5,
      technique_execution: 8.5,
      overall_impact: 8.5,
      synchronization_chemistry: 8.5,
    },
    comment: 'Well rehearsed. Loved the mirror section.',
    updatedAt: new Date(Date.now() - 500000).toISOString(),
  },
];
