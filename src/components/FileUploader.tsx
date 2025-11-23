"use client";

import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
    onFileUpload: (content: string) => void;
}

export default function FileUploader({ onFileUpload }: FileUploaderProps) {
    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            onFileUpload(content);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
        >
            <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInput}
                className="hidden"
                id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">Upload Inventory File</h3>
                <p className="text-sm text-gray-500 mt-2">Drag and drop your CSV file here, or click to browse</p>
                <div className="flex items-center mt-4 text-xs text-gray-400">
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    <span>Supports CSV format</span>
                </div>
            </label>
        </div>
    );
}
