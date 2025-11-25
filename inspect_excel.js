const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Get headers (first row)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length > 0) {
        console.log('Headers found:', jsonData[0]);

        // Also show first row of data to verify content type
        if (jsonData.length > 1) {
            console.log('First row of data:', jsonData[1]);
        }
    } else {
        console.log('File appears to be empty or unreadable.');
    }
} catch (error) {
    console.error('Error reading file:', error.message);
}
