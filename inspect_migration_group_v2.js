const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read all rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    const groupIndex = 35; // Confirmed index

    const values = new Set();

    // Data starts at index 2
    for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        const val = row[groupIndex];
        // Capture empty strings/spaces too to see how they look
        values.add(String(val).trim());
    }

    console.log('Unique values in Migration Group (Index 35):', Array.from(values));

} catch (error) {
    console.error('Error reading file:', error.message);
}
