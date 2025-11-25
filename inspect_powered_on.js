const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Migration.xlsx');
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read all rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Skip title row (index 0) and header row (index 1)
    // Headers are at index 1
    const headers = jsonData[1];
    const poweredOnIndex = headers.indexOf('Powered On');

    console.log(`'Powered On' column index: ${poweredOnIndex}`);

    if (poweredOnIndex === -1) {
        console.log('Could not find "Powered On" column');
        process.exit(1);
    }

    const values = new Set();

    // Data starts at index 2
    for (let i = 2; i < jsonData.length; i++) {
        const row = jsonData[i];
        const val = row[poweredOnIndex];
        if (val) values.add(String(val).trim());
    }

    console.log('Unique values in "Powered On":', Array.from(values));

} catch (error) {
    console.error('Error reading file:', error.message);
}
