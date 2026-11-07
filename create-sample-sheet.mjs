import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';

const rows = [
  {
    'Timestamp': '2026-11-01 10:15:00',
    'NAME': 'Kavya Raman',
    'REGISTRATION NUMBER': '25BCE1042',
    'PHONE NUMBER': 9876543210,
    'COLLEGE MAIL': 'kavya.raman2025@college.edu',
    'CATEGORY': 'SOLO',
    'VIDEO LINK': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'Performer 2 Name': '',
    'Performer 2 Reg': '',
    'Performer 2 Phone': '',
    'Performer 2 Mail': '',
    'VIDEO LINK 2': '',
    'Performer 3 Name': '',
    'Performer 3 Reg': '',
    'Performer 3 Phone': '',
    'Performer 3 Mail': '',
    'VIDEO LINK 3': '',
  },
  // Earlier duplicate submission of Kavya (should be superseded by row above)
  {
    'Timestamp': '2026-10-31 18:30:00',
    'NAME': 'Kavya Raman',
    'REGISTRATION NUMBER': '25BCE1042',
    'PHONE NUMBER': '9876543210',
    'COLLEGE MAIL': 'kavya.raman2025@college.edu',
    'CATEGORY': 'SOLO',
    'VIDEO LINK': 'https://drive.google.com/file/d/older_test_link/view',
    'Performer 2 Name': '',
    'Performer 2 Reg': '',
    'Performer 2 Phone': '',
    'Performer 2 Mail': '',
    'VIDEO LINK 2': '',
    'Performer 3 Name': '',
    'Performer 3 Reg': '',
    'Performer 3 Phone': '',
    'Performer 3 Mail': '',
    'VIDEO LINK 3': '',
  },
  // Duo submission
  {
    'Timestamp': '2026-11-02 12:00:00',
    'NAME': 'Rishi Kapoor',
    'REGISTRATION NUMBER': '24BIT1020',
    'PHONE NUMBER': 9811223344,
    'COLLEGE MAIL': 'rishi.k2024@college.edu',
    'CATEGORY': 'DUO',
    'VIDEO LINK': 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view',
    'Performer 2 Name': 'Ananya Sen',
    'Performer 2 Reg': '24BEE1040',
    'Performer 2 Phone': 9811223345,
    'Performer 2 Mail': 'ananya.sen2024@college.edu',
    'VIDEO LINK 2': '',
    'Performer 3 Name': '',
    'Performer 3 Reg': '',
    'Performer 3 Phone': '',
    'Performer 3 Mail': '',
    'VIDEO LINK 3': '',
  },
  // Trio submission
  {
    'Timestamp': '2026-11-03 14:45:00',
    'NAME': 'Dev Patel',
    'REGISTRATION NUMBER': '23BME1105',
    'PHONE NUMBER': 9822334455,
    'COLLEGE MAIL': 'dev.patel2023@college.edu',
    'CATEGORY': 'TRIO',
    'VIDEO LINK': 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    'Performer 2 Name': 'Isha Roy',
    'Performer 2 Reg': '23BCS1204',
    'Performer 2 Phone': 9822334456,
    'Performer 2 Mail': 'isha.roy2023@college.edu',
    'VIDEO LINK 2': 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    'Performer 3 Name': 'Tarun Rao',
    'Performer 3 Reg': '23BEC1098',
    'Performer 3 Phone': 9822334457,
    'Performer 3 Mail': 'tarun.rao2023@college.edu',
    'VIDEO LINK 3': '',
  },
  // Flagged row: Invalid Registration format
  {
    'Timestamp': '2026-11-04 09:10:00',
    'NAME': 'Siddharth Rao',
    'REGISTRATION NUMBER': '26BEE', // Too short, fails ^\d{2}[A-Za-z]{3}\d{4}$
    'PHONE NUMBER': 9789012345,
    'COLLEGE MAIL': 'siddharth@college.edu',
    'CATEGORY': 'SOLO',
    'VIDEO LINK': 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    'Performer 2 Name': '',
    'Performer 2 Reg': '',
    'Performer 2 Phone': '',
    'Performer 2 Mail': '',
    'VIDEO LINK 2': '',
    'Performer 3 Name': '',
    'Performer 3 Reg': '',
    'Performer 3 Phone': '',
    'Performer 3 Mail': '',
    'VIDEO LINK 3': '',
  },
  // Flagged row: Junk test submission
  {
    'Timestamp': '2026-11-04 11:30:00',
    'NAME': 'afkn', // Obvious junk name
    'REGISTRATION NUMBER': '99ZZZ9999',
    'PHONE NUMBER': 9999999999,
    'COLLEGE MAIL': 'test@junk.com',
    'CATEGORY': 'SOLO',
    'VIDEO LINK': 'none',
    'Performer 2 Name': '',
    'Performer 2 Reg': '',
    'Performer 2 Phone': '',
    'Performer 2 Mail': '',
    'VIDEO LINK 2': '',
    'Performer 3 Name': '',
    'Performer 3 Reg': '',
    'Performer 3 Phone': '',
    'Performer 3 Mail': '',
    'VIDEO LINK 3': '',
  },
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, 'Form Responses 1');

const outPath = path.resolve('sample_dance_submissions.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Sample spreadsheet generated successfully at:', outPath);
