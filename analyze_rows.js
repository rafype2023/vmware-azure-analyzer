const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read all rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    console.log(`Total rows in sheet: ${jsonData.length}`);

    let validServers = 0;
    let emptyRows = 0;
    let titleRows = 0;

    // Simulate the logic in page.tsx
    // We assume row 1 (index 1) is header if row 0 is title

    // Check row 0
    const row0 = jsonData[0];
    console.log('Row 0:', JSON.stringify(row0).substring(0, 100) + '...');

    let dataRows = jsonData;
    let headerRowIndex = 0;

    if (row0 && row0.length > 0 && (row0[0] === 'Servers' || row0.length < 3)) {
        console.log('Detected Title Row at index 0');
        headerRowIndex = 1;
        dataRows = jsonData.slice(2); // Skip title and header
    } else {
        dataRows = jsonData.slice(1); // Skip header
    }

    console.log(`Processing ${dataRows.length} potential data rows...`);

    dataRows.forEach((row, index) => {
        // Check if row has data in the "Server Name" column (index 0 usually)
        // In the file, "Server Name" is the first column.
        const serverName = row[0];

        if (serverName && typeof serverName === 'string' && serverName.trim().length > 0) {
            validServers++;
        } else {
            emptyRows++;
        }
    });

    console.log(`Valid Servers found: ${validServers}`);
    console.log(`Empty/Invalid rows: ${emptyRows}`);

} catch (error) {
    console.error('Error reading file:', error.message);
}
