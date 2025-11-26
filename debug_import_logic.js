const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Simulate FileUploader behavior: sheet_to_json with default options
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Loaded ${data.length} rows from sheet_to_json`);

    // Simulate page.tsx logic
    let headers = [];
    let rowsToProcess = data;

    const firstRow = data[0];
    const firstRowKeys = Object.keys(firstRow || {});

    console.log('First Row Keys:', firstRowKeys.slice(0, 5), '...');

    // Check if this looks like the "Migration.xlsx" title row situation
    if (firstRowKeys.includes('Servers') || firstRowKeys.some(k => k.startsWith('__EMPTY'))) {
        console.log('Detected Title Row logic');
        // The values of the first row are likely the real headers
        headers = Object.values(firstRow).map(v => String(v));
        rowsToProcess = data.slice(1); // Skip the header row
    } else {
        console.log('Standard CSV/Excel logic');
        headers = firstRowKeys;
    }

    console.log('Extracted Headers (first 5):', headers.slice(0, 5));

    // Find "Migration Group" index in headers
    const groupHeaderIndex = headers.findIndex(h => h.trim() === 'Migration Group');
    console.log(`"Migration Group" found at index: ${groupHeaderIndex}`);

    if (groupHeaderIndex !== -1) {
        console.log(`Header at index ${groupHeaderIndex}: "${headers[groupHeaderIndex]}"`);
    }

    // Process first 5 rows
    console.log('\nProcessing first 5 data rows:');

    for (let i = 0; i < Math.min(rowsToProcess.length, 5); i++) {
        const row = rowsToProcess[i];
        const normalizedRow = {};

        if (headers.length > 0 && headers[0] !== firstRowKeys[0]) {
            // Custom headers logic
            const originalKeys = Object.keys(firstRow); // Keys from the TITLE row object

            originalKeys.forEach((key, index) => {
                const header = headers[index];
                if (header) {
                    // IMPORTANT: This is the logic from page.tsx
                    // normalizedRow[header.toLowerCase().trim()] = String(row[key] || '');

                    // Debugging this specific mapping
                    if (header === 'Migration Group') {
                        console.log(`Row ${i} - Key for Migration Group: "${key}"`);
                        console.log(`Row ${i} - Raw Value: "${row[key]}"`);
                    }

                    normalizedRow[header.toLowerCase().trim()] = String(row[key] || '');
                }
            });
        } else {
            // Standard logic
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase().trim()] = String(row[key] || '');
            });
        }

        const extractedGroup = normalizedRow['migration group'];
        console.log(`Row ${i} - Extracted Group: "${extractedGroup}"`);
    }

} catch (error) {
    console.error('Error:', error);
}
