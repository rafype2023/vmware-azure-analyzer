import React from 'react';
import { Server as ServerIcon, Cpu, HardDrive, DollarSign } from 'lucide-react';
import { AnalysisResult } from '@/lib/types';

interface DashboardStatsProps {
    stats: AnalysisResult;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
                title="Total Servers"
                value={stats.totalServers.toString()}
                icon={<ServerIcon className="w-6 h-6 text-blue-600" />}
                color="bg-blue-50"
            />
            <StatCard
                title="Total vCPUs"
                value={stats.totalCores.toString()}
                icon={<Cpu className="w-6 h-6 text-green-600" />}
                color="bg-green-50"
            />
            <StatCard
                title="Total Memory"
                value={`${stats.totalMemoryGB} GB`}
                icon={<HardDrive className="w-6 h-6 text-purple-600" />}
                color="bg-purple-50"
            />
            <StatCard
                title="Est. Monthly Cost"
                value={`$${stats.estimatedMonthlyCost.toLocaleString()}`}
                subtext="(Azure Pay-As-You-Go)"
                icon={<DollarSign className="w-6 h-6 text-amber-600" />}
                color="bg-amber-50"
            />
        </div>
    );
}

function StatCard({ title, value, subtext, icon, color }: { title: string; value: string; subtext?: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    );
}
