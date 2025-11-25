import React, { useState } from 'react';
import { MaintenanceWindow } from '@/lib/types';
import { X, Plus, Trash2, Calendar, ChevronRight, ChevronDown } from 'lucide-react';

interface MaintenanceWindowManagerProps {
    isOpen: boolean;
    onClose: () => void;
    windows: MaintenanceWindow[];
    onUpdateWindows: (windows: MaintenanceWindow[]) => void;
}

export default function MaintenanceWindowManager({
    isOpen,
    onClose,
    windows,
    onUpdateWindows,
}: MaintenanceWindowManagerProps) {
    const [newLabel, setNewLabel] = useState('');
    const [expandedWindowId, setExpandedWindowId] = useState<string | null>(null);

    // State for adding new items within a window
    const [newItemValue, setNewItemValue] = useState('');
    const [activeCategory, setActiveCategory] = useState<'resourceGroups' | 'vnets' | 'subnets' | 'nsgs'>('resourceGroups');

    if (!isOpen) return null;

    const handleAddWindow = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLabel) {
            const newWindow: MaintenanceWindow = {
                id: crypto.randomUUID(),
                label: newLabel,
                resourceGroups: [],
                vnets: [],
                subnets: [],
                nsgs: [],
            };
            onUpdateWindows([...windows, newWindow]);
            setNewLabel('');
            setExpandedWindowId(newWindow.id); // Auto-expand new window
        }
    };

    const handleDeleteWindow = (id: string) => {
        onUpdateWindows(windows.filter((w) => w.id !== id));
        if (expandedWindowId === id) setExpandedWindowId(null);
    };

    const handleAddItem = (windowId: string) => {
        if (!newItemValue) return;

        const updatedWindows = windows.map(w => {
            if (w.id === windowId) {
                return {
                    ...w,
                    [activeCategory]: [...w[activeCategory], newItemValue]
                };
            }
            return w;
        });

        onUpdateWindows(updatedWindows);
        setNewItemValue('');
    };

    const handleDeleteItem = (windowId: string, category: 'resourceGroups' | 'vnets' | 'subnets' | 'nsgs', value: string) => {
        const updatedWindows = windows.map(w => {
            if (w.id === windowId) {
                return {
                    ...w,
                    [category]: w[category].filter(item => item !== value)
                };
            }
            return w;
        });
        onUpdateWindows(updatedWindows);
    };

    const toggleExpand = (id: string) => {
        setExpandedWindowId(expandedWindowId === id ? null : id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        Maintenance Windows & Resources
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {/* Add New Window Form */}
                    <form onSubmit={handleAddWindow} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Create New Maintenance Window</h3>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="Label (e.g., Wave 1)"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                            </button>
                        </div>
                    </form>

                    {/* List of Windows */}
                    <div className="space-y-3">
                        {windows.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-8">No maintenance windows defined.</p>
                        ) : (
                            windows.map((w) => (
                                <div key={w.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div
                                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${expandedWindowId === w.id ? 'bg-gray-50 border-b border-gray-200' : ''}`}
                                        onClick={() => toggleExpand(w.id)}
                                    >
                                        <div className="flex items-center">
                                            {expandedWindowId === w.id ? (
                                                <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                                            )}
                                            <div>
                                                <span className="font-medium text-gray-900">{w.label}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteWindow(w.id); }}
                                            className="text-red-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {expandedWindowId === w.id && (
                                        <div className="p-4 bg-white">
                                            {/* Category Tabs */}
                                            <div className="flex border-b border-gray-200 mb-4">
                                                {(['resourceGroups', 'vnets', 'subnets', 'nsgs'] as const).map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setActiveCategory(cat)}
                                                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeCategory === cat
                                                            ? 'border-blue-500 text-blue-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        {cat === 'resourceGroups' ? 'Resource Groups' :
                                                            cat === 'vnets' ? 'VNets' :
                                                                cat === 'subnets' ? 'Subnets' : 'NSGs'}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Add Item Input */}
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={newItemValue}
                                                    onChange={(e) => setNewItemValue(e.target.value)}
                                                    placeholder={`Add new ${activeCategory === 'resourceGroups' ? 'Resource Group' : activeCategory.slice(0, -1)}...`}
                                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-sm"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(w.id)}
                                                />
                                                <button
                                                    onClick={() => handleAddItem(w.id)}
                                                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {/* Items List */}
                                            <div className="flex flex-wrap gap-2">
                                                {w[activeCategory].length === 0 ? (
                                                    <p className="text-sm text-gray-400 italic w-full">No items added yet.</p>
                                                ) : (
                                                    w[activeCategory].map((item, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700">
                                                            {item}
                                                            <button
                                                                onClick={() => handleDeleteItem(w.id, activeCategory, item)}
                                                                className="ml-1.5 text-gray-400 hover:text-red-500"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
