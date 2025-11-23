"use client";

import React, { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import DashboardStats from '@/components/DashboardStats';
import ServerTable from '@/components/ServerTable';
import ServerEditor from '@/components/ServerEditor';
import { Server, AnalysisResult, AzureConfiguration } from '@/lib/types';
import { Cloud, Download } from 'lucide-react';

export default function Home() {
  const [servers, setServers] = useState<Server[]>([]);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalysisResult>({
    totalServers: 0,
    totalCores: 0,
    totalMemoryGB: 0,
    totalStorageTB: 0,
    estimatedMonthlyCost: 0,
    completionPercentage: 0,
  });

  const handleFileUpload = (content: string) => {
    // Basic CSV parsing logic
    const lines = content.split('\n');
    const parsedServers: Server[] = [];

    // Skip header row if present (simple heuristic)
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length >= 3) {
        // Assuming format: Name, OS, Cores, Memory, Storage
        // Adjust indices based on actual CSV format or make it smarter later
        parsedServers.push({
          id: `srv-${i}`,
          name: parts[0] || `Server ${i}`,
          os: parts[1] || 'Unknown',
          cores: parseInt(parts[2]) || 2,
          memoryGB: parseInt(parts[3]) || 4,
          storageGB: parseInt(parts[4]) || 100,
        });
      }
    }

    setServers(parsedServers);
  };

  const handleSaveConfig = (serverId: string, config: AzureConfiguration) => {
    const updatedServers = servers.map(s =>
      s.id === serverId ? { ...s, azureConfig: config } : s
    );
    setServers(updatedServers);

    // Find next server index
    const currentIndex = servers.findIndex(s => s.id === serverId);
    if (currentIndex < servers.length - 1) {
      setEditingServerId(servers[currentIndex + 1].id);
    } else {
      setEditingServerId(null);
    }
  };

  const handleViewReport = () => {
    if (servers.length === 0) return;
    localStorage.setItem('migration_report_data', JSON.stringify(servers));
    window.open('/report', '_blank');
  };

  const handleExport = () => {
    if (servers.length === 0) return;

    const headers = [
      'ServerName', 'OS', 'Cores', 'MemoryGB', 'StorageGB',
      'Azure_ResourceGroup', 'Azure_Region', 'Azure_VMSize', 'Azure_VNET', 'Azure_Subnet', 'Azure_NSG', 'Azure_PublicIP', 'Azure_Tags'
    ].join(',');

    const rows = servers.map(s => {
      const c = s.azureConfig;
      const tags = c ? Object.entries(c.tags).map(([k, v]) => `${k}=${v}`).join(';') : '';
      return [
        s.name, s.os, s.cores, s.memoryGB, s.storageGB,
        c?.resourceGroup || '', c?.region || '', c?.vmSize || '', c?.vnetName || '', c?.subnetName || '', c?.nsgName || '', c?.publicIp ? 'Yes' : 'No', tags
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'azure_migration_plan.csv';
    a.click();
  };

  useEffect(() => {
    // Recalculate stats when servers change
    const totalCores = servers.reduce((acc, s) => acc + s.cores, 0);
    const totalMemoryGB = servers.reduce((acc, s) => acc + s.memoryGB, 0);
    const totalStorageGB = servers.reduce((acc, s) => acc + s.storageGB, 0);
    const completedCount = servers.filter(s => s.azureConfig?.status === 'Complete').length;

    // Rough cost estimation logic (placeholder)
    // Assume avg $40/core/month + storage costs
    const estimatedCost = (totalCores * 40) + (totalStorageGB * 0.1);

    setStats({
      totalServers: servers.length,
      totalCores,
      totalMemoryGB,
      totalStorageTB: Math.round((totalStorageGB / 1024) * 100) / 100,
      estimatedMonthlyCost: Math.round(estimatedCost),
      completionPercentage: servers.length > 0 ? Math.round((completedCount / servers.length) * 100) : 0,
    });
  }, [servers]);

  const editingServer = servers.find(s => s.id === editingServerId);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">VMware to Azure Analyzer</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleViewReport}
                disabled={servers.length === 0}
                className="text-sm text-gray-600 font-medium hover:text-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 px-3 py-2 rounded-md bg-white"
              >
                View PDF Report
              </button>
              <button
                onClick={handleExport}
                disabled={servers.length === 0}
                className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {servers.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Start Your Migration Journey</h2>
              <p className="text-gray-500 mt-2">Upload your server inventory to get instant insights.</p>
            </div>
            <FileUploader onFileUpload={handleFileUpload} />
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Sample CSV Format: ServerName, OS, Cores, MemoryGB, StorageGB
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">Migration Progress</h2>
              <span className="text-sm font-medium text-blue-600">{stats.completionPercentage}% Configured</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${stats.completionPercentage}%` }}></div>
            </div>

            <DashboardStats stats={stats} />
            <ServerTable servers={servers} onEdit={(s) => setEditingServerId(s.id)} />

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setServers([])}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Upload different file
              </button>
            </div>
          </>
        )}
      </div>

      {editingServer && (
        <ServerEditor
          server={editingServer}
          onSave={handleSaveConfig}
          onCancel={() => setEditingServerId(null)}
          isLast={servers.indexOf(editingServer) === servers.length - 1}
        />
      )}
    </main>
  );
}
