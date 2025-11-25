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

  const handleFileUpload = async (content: string) => {
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
        parsedServers.push({
          id: crypto.randomUUID(),
          name: parts[0]?.trim() || `Server ${i}`,
          os: parts[1]?.trim() || 'Unknown',
          cores: parseInt(parts[2]?.trim()) || 2,
          memoryGB: parseInt(parts[3]?.trim()) || 4,
          storageGB: parseInt(parts[4]?.trim()) || 100,
          ip: parts[5]?.trim() || '',
          azureConfig: undefined
        });
      }
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
          ip: uploaded.ip
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
                  Server Inventory
                </h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {servers.length} Servers
                </span>
              </div>
              <ServerTable
                servers={servers}
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
