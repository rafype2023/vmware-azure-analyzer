const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Simulate FileUploader behavior
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Loaded ${data.length} rows`);

    // Logic from page.tsx to setup headers
    let headers = [];
    const firstRow = data[0];
    const firstRowKeys = Object.keys(firstRow || {});

    if (firstRowKeys.includes('Servers') || firstRowKeys.some(k => k.startsWith('__EMPTY'))) {
        headers = Object.values(firstRow).map(v => String(v));
    } else {
        headers = firstRowKeys;
    }

    // Find the server
    const targetServerName = 'FBA02440';
    let targetRow = null;
    let targetRowIndex = -1;

    // We need to loop and find the row where 'Server Name' (or mapped key) matches
    // But first, let's just look for the string in values to find the row index
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const values = Object.values(row).map(v => String(v));
        if (values.includes(targetServerName)) {
            targetRow = row;
            targetRowIndex = i;
            break;
        }
    }

    if (!targetRow) {
        console.log(`Server ${targetServerName} not found in data!`);
        process.exit(1);
    }

    console.log(`Found ${targetServerName} at row index ${targetRowIndex}`);
    console.log('Raw Row Data:', JSON.stringify(targetRow, null, 2));

    // Now apply the extraction logic
    const normalizedRow = {};

    if (headers.length > 0 && headers[0] !== firstRowKeys[0]) {
        const originalKeys = Object.keys(firstRow);
        originalKeys.forEach((key, index) => {
            const header = headers[index];
            if (header) {
                normalizedRow[header.toLowerCase().trim()] = String(targetRow[key] || '');

                if (header === 'Migration Group') {
                    console.log(`Mapping 'Migration Group' from key '${key}'`);
                    console.log(`Value: '${targetRow[key]}'`);
                }
            }
        });
    } else {
        // Standard
        Object.keys(targetRow).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = String(targetRow[key] || '');
        });
    }

    console.log('Extracted Migration Group:', normalizedRow['migration group']);

} catch (error) {
    console.error('Error:', error);
}
