const XLSX = require('xlsx');

const data = [
    { Name: 'TestServer1', OS: 'Windows Server 2019', Cores: 4, Memory: 16, Storage: 500, IP: '192.168.1.10' },
    { Name: 'TestServer2', OS: 'Ubuntu 20.04', Cores: 2, Memory: 8, Storage: 100, IP: '192.168.1.11' },
    { Name: 'TestServer3', OS: 'RHEL 8', Cores: 8, Memory: 32, Storage: 1000, IP: '192.168.1.12' }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

XLSX.writeFile(wb, 'test_inventory.xlsx');
console.log('Created test_inventory.xlsx');
