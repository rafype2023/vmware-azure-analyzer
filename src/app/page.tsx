"use client";

import React, { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import DashboardStats from '@/components/DashboardStats';
import ServerTable from '@/components/ServerTable';
import ServerEditor from '@/components/ServerEditor';
import MaintenanceWindowManager from '@/components/MaintenanceWindowManager';
import { Server, AnalysisResult, AzureConfiguration, MaintenanceWindow } from '@/lib/types';
import { Cloud, Download, Calendar } from 'lucide-react';

export default function Home() {
  const [servers, setServers] = useState<Server[]>([]);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [isWindowManagerOpen, setIsWindowManagerOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [serversRes, windowsRes] = await Promise.all([
          fetch('/api/servers'),
          fetch('/api/maintenance')
        ]);

        if (serversRes.ok) {
          const loadedServers = await serversRes.json();
          setServers(loadedServers);
        }

        if (windowsRes.ok) {
          const loadedWindows = await windowsRes.json();
          setMaintenanceWindows(loadedWindows);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const [selectedPhases, setSelectedPhases] = useState<string[]>([
    'Milestone 1', 'Milestone 2', 'Milestone 3', 'Milestone 4'
  ]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([
    'Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'TBD', 'No Group'
  ]);

  const togglePhase = (phase: string) => {
    setSelectedPhases(prev =>
      prev.includes(phase)
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleFileUpload = async (data: unknown[]) => {
    const parsedServers: Server[] = [];

    // Detect if first row is a title row (e.g. ["Servers"])
    // If so, headers are likely on the second row
    // If we have a title row, we need to re-parse the data using the second row as headers
    // But since we receive already parsed JSON from FileUploader (which uses first row as header by default),
    // we might need to adjust.
    // Actually, FileUploader uses `sheet_to_json` which defaults to first row as header.
    // If the first row is "Servers", `sheet_to_json` might produce keys like "Servers", "__EMPTY", "__EMPTY_1"...
    // A better approach for FileUploader might be to pass raw sheet or use "header: 1" (array of arrays).
    // However, to avoid changing FileUploader again, let's try to work with what we have or
    // simply accept that for this specific file, we might need to be smarter.

    // WAIT: FileUploader uses `sheet_to_json(worksheet)`. If row 1 is "Servers", then row 2 becomes data.
    // This is problematic. We should probably update FileUploader to return array of arrays (header: 1)
    // OR we can try to infer.

    // Let's assume FileUploader returns array of objects.
    // If row 1 is "Servers", then the keys of the objects in `data` will be "Servers", "__EMPTY", etc.
    // And the first item in `data` will be the actual headers? No, `sheet_to_json` treats row 1 as keys.
    // So `data[0]` would be: { "Servers": "Server Name", "__EMPTY": "Completed...", ... }

    // So if we detect this pattern, we can map the keys from `data[0]` to the values in `data[0]`.

    // Let's refine the logic:
    // 1. Check if keys look like garbage ("__EMPTY") or title ("Servers").
    // 2. If so, treat `data[0]` as the mapping source.

    let headers: string[] = [];
    let rowsToProcess = data;

    const firstRow = data[0] as Record<string, unknown>;
    const firstRowKeys = Object.keys(firstRow || {});

    // Check if this looks like the "Migration.xlsx" title row situation
    if (firstRowKeys.includes('Servers') || firstRowKeys.some(k => k.startsWith('__EMPTY'))) {
      // The values of the first row are likely the real headers
      // e.g. { "Servers": "Server Name", "__EMPTY": "Completed (Yes/No)", ... }
      headers = Object.values(firstRow).map(v => String(v));
      rowsToProcess = data.slice(1); // Skip the header row
    } else {
      // Standard CSV/Excel where first row was headers
      headers = firstRowKeys;
    }

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i] as Record<string, unknown>;
      // If we re-mapped headers, we need to access row by the original keys (which are the indices if we used header:1, but here they are the garbage keys)
      // This is getting complicated because `sheet_to_json` without options is rigid.

      // ALTERNATIVE: Just map loosely based on values if we can, or...
      // Let's look at the `row` object.

      // If we are in the "Title Row" scenario:
      // `row` has keys: "Servers", "__EMPTY", "__EMPTY_1"...
      // We need to map these keys to our `headers` array we extracted from `data[0]`.

      const normalizedRow: Record<string, string | undefined> = {};

      if (headers.length > 0 && headers[0] !== firstRowKeys[0]) {
        // We are using custom headers extracted from data[0]
        // We need to map the values from `row` to these headers.
        // The `row` keys match the `firstRow` keys.
        const originalKeys = Object.keys(firstRow); // ["Servers", "__EMPTY", ...]

        originalKeys.forEach((key, index) => {
          const header = headers[index]; // "Server Name"
          if (header) {
            normalizedRow[header.toLowerCase().trim()] = String(row[key] || '');
          }
        });
      } else {
        // Standard case
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = String(row[key] || '');
        });
      }

      // Skip empty rows
      if (!normalizedRow['server name'] && !normalizedRow.name && !normalizedRow.hostname) continue;

      // Filter by "Powered On" status if present
      // We only want to import servers that are "poweredOn"
      const poweredOnStatus = normalizedRow['powered on'];
      if (poweredOnStatus && String(poweredOnStatus).toLowerCase() !== 'poweredon') {
        continue;
      }

      // Filter by "Migration Phase"
      // Only allow Milestone 1, Milestone 2, Milestone 3, Milestone 4
      const migrationPhase = normalizedRow['migration phase'] ? String(normalizedRow['migration phase']).trim() : undefined;
      const allowedPhases = ['Milestone 1', 'Milestone 2', 'Milestone 3', 'Milestone 4'];

      if (migrationPhase && !allowedPhases.includes(migrationPhase)) {
        continue;
      }

      // Filter by "Migration Group"
      // Allow Group 1-6, TBD, or No Group (from empty/space)
      let migrationGroup = normalizedRow['migration group'] ? String(normalizedRow['migration group']).trim() : 'No Group';
      if (migrationGroup === '') migrationGroup = 'No Group';

      const allowedGroups = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'TBD', 'No Group'];

      if (!allowedGroups.includes(migrationGroup)) {
        continue;
      }

      // Map specific columns from Migration.xlsx
      const name = normalizedRow['server name'] || normalizedRow.name || normalizedRow.hostname || `Server ${i}`;
      const os = normalizedRow['operating system'] || normalizedRow.os || 'Unknown';
      const cores = parseInt(normalizedRow["vcpu's"] || normalizedRow.cores || normalizedRow.vcpu || '2') || 2;
      const memoryGB = parseInt(normalizedRow["vram (gb's)"] || normalizedRow.memory || normalizedRow.ram || '4') || 4;

      // Storage: Handle "Storage Provisioned (MB's)" -> convert to GB
      let storageGB = 100;
      if (normalizedRow["storage provisioned (mb's)"]) {
        storageGB = Math.round(parseInt(normalizedRow["storage provisioned (mb's)"]) / 1024);
      } else {
        storageGB = parseInt(normalizedRow.storage || normalizedRow.disk || '100') || 100;
      }

      const ipAddress = normalizedRow['ip address'] || normalizedRow.ip || normalizedRow.ipaddress || '';

      parsedServers.push({
        id: crypto.randomUUID(),
        name,
        os,
        cores,
        memoryGB,
        storageGB,
        ipAddress,
        migrationPhase,
        migrationGroup,
        azureConfig: undefined
      });
    }

    // Merge uploaded servers with existing ones
    // If server exists (by hostname), keep existing config but update hardware specs if needed
    const mergedServers = [...servers];

    for (const uploaded of parsedServers) {
      const existingIndex = mergedServers.findIndex(s => s.name === uploaded.name);
      if (existingIndex >= 0) {
        // Keep existing config, update specs
        mergedServers[existingIndex] = {
          ...mergedServers[existingIndex],
          cores: uploaded.cores,
          memoryGB: uploaded.memoryGB,
          storageGB: uploaded.storageGB,
          os: uploaded.os,
          ipAddress: uploaded.ipAddress,
          migrationPhase: uploaded.migrationPhase,
          migrationGroup: uploaded.migrationGroup
        };
      } else {
        mergedServers.push(uploaded);
      }
    }

    setServers(mergedServers);

    // Persist to DB
    try {
      await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedServers),
      });
    } catch (error) {
      console.error('Failed to save servers:', error);
    }
  };

  const handleSaveConfig = async (serverId: string, config: AzureConfiguration) => {
    const updatedServers = servers.map(s =>
      s.id === serverId ? { ...s, azureConfig: config } : s
    );
    setServers(updatedServers);
    setEditingServerId(null);

    // Persist to DB
    try {
      await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedServers),
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleUpdateWindows = async (windows: MaintenanceWindow[]) => {
    setMaintenanceWindows(windows);

    // Persist to DB
    try {
      await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(windows),
      });
    } catch (error) {
      console.error('Failed to save maintenance windows:', error);
    }
  };

  const editingServer = servers.find(s => s.id === editingServerId);

  // Calculate stats
  const stats: AnalysisResult = {
    totalServers: servers.length,
    totalCores: servers.reduce((acc, s) => acc + s.cores, 0),
    totalMemoryGB: servers.reduce((acc, s) => acc + s.memoryGB, 0),
    totalStorageTB: servers.reduce((acc, s) => acc + s.storageGB, 0) / 1024,
    estimatedMonthlyCost: servers.reduce((acc, s) => {
      const baseRate = 0.05; // $ per core hour
      return acc + (s.cores * baseRate * 730);
    }, 0),
    completionPercentage: servers.length > 0 ? Math.round((servers.filter(s => s.azureConfig?.status === 'Complete').length / servers.length) * 100) : 0,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Cloud className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">VMware to Azure Analyzer</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsWindowManagerOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Manage Maintenance Windows
              </button>
              <a
                href="/report"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {servers.length === 0 ? (
          <FileUploader onFileUpload={handleFileUpload} />
        ) : (
          <div className="space-y-8">
            <DashboardStats stats={stats} />

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Filter by Phase
                </h3>
              </div>
              <div className="px-4 py-4 flex flex-wrap gap-4">
                {['Milestone 1', 'Milestone 2', 'Milestone 3', 'Milestone 4'].map(phase => (
                  <label key={phase} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPhases.includes(phase)}
                      onChange={() => togglePhase(phase)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{phase}</span>
                  </label>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100"></div>
              <div className="px-4 py-4 flex flex-wrap gap-4">
                {['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'TBD', 'No Group'].map(group => (
                  <label key={group} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group)}
                      onChange={() => toggleGroup(group)}
                      className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{group}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Server Inventory
                </h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {servers.filter(s =>
                    (!s.migrationPhase || selectedPhases.includes(s.migrationPhase)) &&
                    (!s.migrationGroup || selectedGroups.includes(s.migrationGroup))
                  ).length} / {servers.length} Servers
                </span>
              </div>
              <ServerTable
                servers={servers.filter(s =>
                  (!s.migrationPhase || selectedPhases.includes(s.migrationPhase)) &&
                  (!s.migrationGroup || selectedGroups.includes(s.migrationGroup))
                )}
                onEdit={(s) => setEditingServerId(s.id)}
              />
            </div>
          </div>
        )}
      </div>

      {editingServer && (
        <ServerEditor
          server={editingServer}
          onSave={handleSaveConfig}
          onCancel={() => setEditingServerId(null)}
          isLast={servers.indexOf(editingServer) === servers.length - 1}
          maintenanceWindows={maintenanceWindows}
        />
      )}

      <MaintenanceWindowManager
        isOpen={isWindowManagerOpen}
        onClose={() => setIsWindowManagerOpen(false)}
        windows={maintenanceWindows}
        onUpdateWindows={handleUpdateWindows}
      />
    </main>
  );
}
