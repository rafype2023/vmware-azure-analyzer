import React from 'react';
import { Server } from '@/lib/types';
import { Edit, CheckCircle, Circle } from 'lucide-react';

interface ServerTableProps {
    servers: Server[];
    onEdit: (server: Server) => void;
}

export default function ServerTable({ servers, onEdit }: ServerTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Server Inventory</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-medium">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Server Name</th>
                            <th className="px-6 py-4">OS</th>
                            <th className="px-6 py-4">vCPUs</th>
                            <th className="px-6 py-4">Memory (GB)</th>
                            <th className="px-6 py-4">Rec. Azure VM</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {servers.map((server) => (
                            <tr key={server.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    {server.azureConfig?.status === 'Complete' ? (
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            <span className="text-xs font-medium">Ready</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-gray-400">
                                            <Circle className="w-4 h-4 mr-1" />
                                            <span className="text-xs font-medium">Pending</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{server.name}</td>
                                <td className="px-6 py-4">{server.os}</td>
                                <td className="px-6 py-4">{server.cores}</td>
                                <td className="px-6 py-4">{server.memoryGB}</td>
                                <td className="px-6 py-4 text-blue-600 font-medium">
                                    {server.azureConfig?.vmSize || 'Not Configured'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onEdit(server)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center"
                                    >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {servers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                    No servers found. Upload an inventory file to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
