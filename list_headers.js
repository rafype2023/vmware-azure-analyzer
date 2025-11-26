const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read all rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Headers are at index 1
    const headers = jsonData[1];

    console.log('All Headers:');
    headers.forEach((h, i) => {
        console.log(`Index ${i}: ${h}`);
    });

} catch (error) {
    console.error('Error reading file:', error.message);
}
