const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read all rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Headers are at index 1
    const headers = jsonData[1];
    const phaseIndex = headers.indexOf('Migration Phase');

    console.log(`'Migration Phase' column index: ${phaseIndex}`);

    if (phaseIndex === -1) {
        console.log('Could not find "Migration Phase" column');
        process.exit(1);
    }

    const values = new Set();

    // Data starts at index 2
    for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        const val = row[phaseIndex];
        if (val) values.add(String(val).trim());
    }

    console.log('Unique values in "Migration Phase":', Array.from(values));

} catch (error) {
    console.error('Error reading file:', error.message);
}
