"use client";

import React, { useEffect, useState } from 'react';
import { Server } from '@/lib/types';
import { Server as ServerIcon, Cpu, HardDrive, Globe, Tag, Network } from 'lucide-react';

export default function ReportPage() {
    const [servers, setServers] = useState<Server[]>([]);

    useEffect(() => {
        // Load data from localStorage
        const data = localStorage.getItem('migration_report_data');
        if (data) {
            setServers(JSON.parse(data));
        }
    }, []);

    if (servers.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">No data found. Please go back and generate the report again.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 print:bg-white">
            {/* Print Instructions - Hidden when printing */}
            <div className="bg-blue-600 text-white p-4 text-center print:hidden shadow-md">
                <p className="font-medium">
                    Ready to print! Press <span className="font-bold underline cursor-pointer" onClick={() => window.print()}>Cmd + P</span> (or Ctrl + P) to save as PDF.
                </p>
            </div>

            {servers.map((server, index) => (
                <div key={server.id} className="max-w-4xl mx-auto p-8 page-break-after-always min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="border-b-2 border-blue-600 pb-6 mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{server.name}</h1>
                            <div className="flex items-center space-x-4 text-gray-600">
                                <span className="flex items-center"><ServerIcon className="w-4 h-4 mr-2" /> {server.os}</span>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Page {index + 1} of {servers.length}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Migration Analysis Report</p>
                            <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* Current State */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <HardDrive className="w-5 h-5 mr-2 text-gray-500" /> Current Specifications
                            </h2>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <dt className="text-gray-500">vCPUs</dt>
                                    <dd className="font-medium">{server.cores}</dd>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <dt className="text-gray-500">Memory</dt>
                                    <dd className="font-medium">{server.memoryGB} GB</dd>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <dt className="text-gray-500">Storage</dt>
                                    <dd className="font-medium">{server.storageGB} GB</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Target State */}
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                                <Cpu className="w-5 h-5 mr-2 text-blue-600" /> Azure Target
                            </h2>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-blue-200 pb-2">
                                    <dt className="text-blue-600">VM Size</dt>
                                    <dd className="font-bold text-blue-900">{server.azureConfig?.vmSize || 'Not Configured'}</dd>
                                </div>
                                <div className="flex justify-between border-b border-blue-200 pb-2">
                                    <dt className="text-blue-600">OS Disk</dt>
                                    <dd className="font-medium text-blue-900">{server.azureConfig?.osDiskType || '-'}</dd>
                                </div>
                                <div className="flex justify-between border-b border-blue-200 pb-2">
                                    <dt className="text-blue-600">Region</dt>
                                    <dd className="font-medium text-blue-900">{server.azureConfig?.region || '-'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Configuration Details */}
                    <div className="space-y-6 flex-grow">
                        {/* Identity & Network */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center border-b pb-2">
                                    <Globe className="w-4 h-4 mr-2 text-gray-500" /> Identity & Location
                                </h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-500 w-1/3">Resource Group</td>
                                            <td className="py-2 font-medium">{server.azureConfig?.resourceGroup || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-500">Region</td>
                                            <td className="py-2 font-medium">{server.azureConfig?.region || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center border-b pb-2">
                                    <Network className="w-4 h-4 mr-2 text-gray-500" /> Network Configuration
                                </h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-500 w-1/3">Virtual Network</td>
                                            <td className="py-2 font-medium">{server.azureConfig?.vnetName || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-500">Subnet</td>
                                            <td className="py-2 font-medium">{server.azureConfig?.subnetName || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-500">NSG</td>
                                            <td className="py-2 font-medium">{server.azureConfig?.nsgName || '-'}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-500">Public IP</td>
                                            <td className="py-2 font-medium">{server.azureConfig?.publicIp ? 'Yes' : 'No'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="mt-8">
                            <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center border-b pb-2">
                                <Tag className="w-4 h-4 mr-2 text-gray-500" /> Resource Tags
                            </h3>
                            {server.azureConfig?.tags && Object.keys(server.azureConfig.tags).length > 0 ? (
                                <div className="grid grid-cols-3 gap-4">
                                    {Object.entries(server.azureConfig.tags).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 px-3 py-2 rounded border border-gray-200 text-sm">
                                            <span className="block text-xs text-gray-500 uppercase tracking-wider">{key}</span>
                                            <span className="font-medium text-gray-900">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No tags configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                        Generated by VMware to Azure Analyzer
                    </div>
                </div>
            ))}
        </div>
    );
}
