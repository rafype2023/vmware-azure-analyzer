const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read all rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Headers are at index 1
    const headers = jsonData[1];

    // Find column that looks like "Migration Group"
    const groupIndex = headers.findIndex(h => h && String(h).toLowerCase().includes('group'));

    console.log(`Found potential 'Migration Group' column at index: ${groupIndex}, Name: ${headers[groupIndex]}`);

    if (groupIndex === -1) {
        console.log('Could not find "Migration Group" column');
        process.exit(1);
    }

    const values = new Set();

    // Data starts at index 2
    for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        const val = row[groupIndex];
        // Capture empty strings/spaces too to see how they look
        values.add(String(val).trim());
    }

    console.log('Unique values in Group column:', Array.from(values));

} catch (error) {
    console.error('Error reading file:', error.message);
}
