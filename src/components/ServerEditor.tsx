import React, { useState, useEffect } from 'react';
import { Server, AzureConfiguration, MaintenanceWindow } from '@/lib/types';
import { Save, ArrowRight, X, Plus } from 'lucide-react';

interface ServerEditorProps {
    server: Server;
    onSave: (serverId: string, config: AzureConfiguration) => void;
    onCancel: () => void;
    isLast: boolean;
    maintenanceWindows: MaintenanceWindow[];
}

const DEFAULT_CONFIG: AzureConfiguration = {
    resourceGroup: '',
    region: 'eastus2',
    vnetName: '',
    subnetName: '',
    nsgName: '',
    publicIp: false,
    vmSize: 'Standard_D2s_v5',
    osDiskType: 'StandardSSD_LRS',
    tags: { 'Environment': 'Production', 'CostCenter': 'IT' },
    status: 'Complete',
    maintenanceWindowIds: {}
};

export default function ServerEditor({ server, onSave, onCancel, isLast, maintenanceWindows }: ServerEditorProps) {
    const [config, setConfig] = useState<AzureConfiguration>(
        server.azureConfig || { ...DEFAULT_CONFIG, vmSize: recommendVmSize(server) }
    );

    const [newTagKey, setNewTagKey] = useState('');
    const [newTagValue, setNewTagValue] = useState('');

    // Reset config when server changes
    useEffect(() => {
        setConfig(server.azureConfig || { ...DEFAULT_CONFIG, vmSize: recommendVmSize(server) });
    }, [server]);

    const handleChange = (field: keyof AzureConfiguration, value: AzureConfiguration[keyof AzureConfiguration]) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleResourceChange = (field: 'resourceGroup' | 'vnetName' | 'subnetName' | 'nsgName', value: string) => {
        // Find which window this value belongs to (if any)
        // This is a bit tricky if multiple windows have the same value, but we'll take the first match
        let windowId = undefined;

        // Map field name to MaintenanceWindow property
        const categoryMap: Record<string, keyof MaintenanceWindow> = {
            'resourceGroup': 'resourceGroups',
            'vnetName': 'vnets',
            'subnetName': 'subnets',
            'nsgName': 'nsgs'
        };

        const category = categoryMap[field];
        if (category) {
            for (const w of maintenanceWindows) {
                if (w[category]?.includes(value)) {
                    windowId = w.id;
                    break;
                }
            }
        }

        setConfig(prev => ({
            ...prev,
            [field]: value,
            maintenanceWindowIds: {
                ...prev.maintenanceWindowIds,
                [field === 'resourceGroup' ? 'resourceGroup' :
                    field === 'vnetName' ? 'vnet' :
                        field === 'subnetName' ? 'subnet' : 'nsg']: windowId
            }
        }));
    };

    const addTag = () => {
        if (newTagKey && newTagValue) {
            setConfig(prev => ({
                ...prev,
                tags: { ...prev.tags, [newTagKey]: newTagValue }
            }));
            setNewTagKey('');
            setNewTagValue('');
        }
    };

    const removeTag = (key: string) => {
        const newTags = { ...config.tags };
        delete newTags[key];
        setConfig(prev => ({ ...prev, tags: newTags }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(server.id, { ...config, status: 'Complete' });
    };

    // Helper to render options from all windows
    const renderOptions = (category: 'resourceGroups' | 'vnets' | 'subnets' | 'nsgs') => {
        const options: React.ReactNode[] = [];
        options.push(<option key="default" value="">Select...</option>);

        maintenanceWindows.forEach(w => {
            const items = w[category] as string[];
            if (items && items.length > 0) {
                options.push(
                    <optgroup key={w.id} label={w.label}>
                        {items.map(item => (
                            <option key={`${w.id}-${item}`} value={item}>
                                {item}
                            </option>
                        ))}
                    </optgroup>
                );
            }
        });

        return options;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Configure Server: {server.name}</h2>
                            <p className="text-sm text-gray-500">{server.os} | {server.cores} vCPUs | {server.memoryGB} GB RAM</p>
                        </div>
                        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Identity & Location */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Identity & Location</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Resource Group</label>
                                <select
                                    required
                                    value={config.resourceGroup}
                                    onChange={(e) => handleResourceChange('resourceGroup', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    {renderOptions('resourceGroups')}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Region</label>
                                <select
                                    value={config.region}
                                    onChange={(e) => handleChange('region', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    <option value="eastus">East US</option>
                                    <option value="eastus2">East US 2</option>
                                    <option value="westeurope">West Europe</option>
                                    <option value="southcentralus">South Central US</option>
                                </select>
                            </div>
                        </div>

                        {/* Compute */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Compute</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">VM Size</label>
                                <input
                                    type="text"
                                    required
                                    value={config.vmSize}
                                    onChange={(e) => handleChange('vmSize', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended based on {server.cores} cores, {server.memoryGB}GB RAM</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">OS Disk Type</label>
                                <select
                                    value={config.osDiskType}
                                    onChange={(e) => handleChange('osDiskType', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    <option value="Standard_LRS">Standard HDD</option>
                                    <option value="StandardSSD_LRS">Standard SSD</option>
                                    <option value="Premium_LRS">Premium SSD</option>
                                </select>
                            </div>
                        </div>

                        {/* Network */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Network</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Virtual Network</label>
                                <select
                                    required
                                    value={config.vnetName}
                                    onChange={(e) => handleResourceChange('vnetName', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    {renderOptions('vnets')}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subnet</label>
                                <select
                                    required
                                    value={config.subnetName}
                                    onChange={(e) => handleResourceChange('subnetName', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    {renderOptions('subnets')}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Network Security Group</label>
                                <select
                                    required
                                    value={config.nsgName}
                                    onChange={(e) => handleResourceChange('nsgName', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                >
                                    {renderOptions('nsgs')}
                                </select>
                            </div>
                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    id="publicIp"
                                    checked={config.publicIp}
                                    onChange={(e) => handleChange('publicIp', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="publicIp" className="ml-2 block text-sm text-gray-900">
                                    Assign Public IP Address
                                </label>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Tags</h3>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Key (e.g. Environment)"
                                    value={newTagKey}
                                    onChange={(e) => setNewTagKey(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Value (e.g. Prod)"
                                    value={newTagValue}
                                    onChange={(e) => setNewTagValue(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="bg-gray-100 p-2 rounded-md hover:bg-gray-200"
                                >
                                    <Plus className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(config.tags).map(([key, value]) => (
                                    <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {key}: {value}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(key)}
                                            className="ml-1.5 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-xl">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isLast ? 'Save & Finish' : 'Save & Next Server'}
                            {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function recommendVmSize(server: Server): string {
    if (server.cores <= 2 && server.memoryGB <= 8) return 'Standard_B2s';
    if (server.cores <= 4 && server.memoryGB <= 16) return 'Standard_D4s_v5';
    return 'Standard_D8s_v5';
}
