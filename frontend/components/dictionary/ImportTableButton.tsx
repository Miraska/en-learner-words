'use client';

import { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { auth } from '../../lib/auth';

interface ImportTableButtonProps {
    dictionaryId: number;
    sourceLangId: number;
    onImportComplete: () => void;
}

interface WordData {
    word: string;
    translation: string;
}

export function ImportTableButton({ 
    dictionaryId, 
    sourceLangId, 
    onImportComplete 
}: ImportTableButtonProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [importedData, setImportedData] = useState<WordData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { notify } = useToast();

    const parseCSV = (csvText: string): WordData[] => {
        const lines = csvText.split('\n').filter(line => line.trim());
        const words: WordData[] = [];

        // Detect delimiter (comma, semicolon, or tab)
        const firstLine = lines[0] || '';
        let delimiter = ',';
        if (firstLine.includes('\t')) {
            delimiter = '\t';
        } else if (firstLine.includes(';')) {
            delimiter = ';';
        }

        for (const line of lines) {
            // Improved CSV parsing - handle quotes and common delimiters
            const columns: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    columns.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            columns.push(current.trim());
            
            // Trim quotes at both ends
            const cleanColumns = columns.map(col => 
                col.replace(/^"|"$/g, '').trim()
            );
            
            if (cleanColumns.length >= 2 && cleanColumns[0] && cleanColumns[1]) {
                words.push({
                    word: cleanColumns[0],
                    translation: cleanColumns[1]
                });
            }
        }

        return words;
    };

    const parseExcel = (file: File): Promise<WordData[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    if (!data) {
                        throw new Error('File is empty or corrupted');
                    }
                    
                    const workbook = XLSX.read(data, { type: 'binary' });
                    
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        throw new Error('No sheets found in Excel file');
                    }
                    
                    // Take first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    if (!worksheet) {
                        throw new Error('Failed to read the first sheet');
                    }
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1,
                        defval: '', // Default value for empty cells
                        blankrows: false // Skip empty rows
                    });
                    
                    const words: WordData[] = [];
                    
                    // Process each row
                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i] as any[];
                        
                        // Make sure row has at least 2 columns
                        if (row && row.length >= 2) {
                            const word = String(row[0] || '').trim();
                            const translation = String(row[1] || '').trim();
                            
                            // Skip empty values
                            if (word && translation) {
                                words.push({ word, translation });
                            }
                        }
                    }
                    
                    if (words.length === 0) {
                        throw new Error('No word pairs found in the Excel file');
                    }
                    
                    resolve(words);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error reading Excel file';
                    reject(new Error(errorMessage));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsBinaryString(file);
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            let words: WordData[] = [];
            
            // Detect file type
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            
            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // Handle Excel files
                try {
                    words = await parseExcel(file);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error reading Excel file';
                    notify(errorMessage);
                    return;
                }
            } else {
                // Handle CSV/TSV files
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const csvText = e.target?.result as string;
                        const parsedWords = parseCSV(csvText);
                        
                        if (parsedWords.length === 0) {
                            notify('No word pairs found in the file');
                            return;
                        }

                        setImportedData(parsedWords);
                        setIsModalOpen(true);
                    } catch (error) {
                        notify('Error reading file');
                    }
                };
                reader.onerror = () => {
                    notify('Error reading file');
                };
                reader.readAsText(file);
                return;
            }
            
            if (words.length === 0) {
                notify('No word pairs found in the file');
                return;
            }

            setImportedData(words);
            setIsModalOpen(true);
        } catch (error) {
            notify('Unexpected error while processing the file');
        }
    };

    const handleImport = async () => {
        if (importedData.length === 0) return;

        setIsImporting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/words/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`,
                },
                body: JSON.stringify({
                    words: importedData,
                    dictionaryId,
                    languageId: sourceLangId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to import words');
            }

            const result = await response.json();
            const created = result.created?.length || 0;
            const skipped = result.skipped?.length || 0;

            if (created > 0) {
                notify(`Successfully imported ${created} words${skipped > 0 ? `, ${skipped} skipped` : ''}`);
                onImportComplete();
            } else {
                notify('No words were imported');
            }

            setIsModalOpen(false);
            setImportedData([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            notify('Error importing words');
        } finally {
            setIsImporting(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setImportedData([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import File'}
            </Button>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
            />

            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleCancel}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Import Preview</h3>
                                    <p className="text-sm text-gray-600">Review your data before importing</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isImporting}
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="font-medium text-gray-900">
                                        Found {importedData.length} word pairs
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    First column will be used as words, second column as translations.
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>
                                        Supported formats: Excel (.xlsx, .xls), CSV (comma, semicolon, or tab separated)
                                    </span>
                                </div>
                            </div>
                            
                            {/* Preview Table */}
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                                                    Word
                                                </th>
                                                <th className="text-left px-6 py-4 font-medium text-gray-900">
                                                    Translation
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {importedData.slice(0, 20).map((word, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3 border-r border-gray-200">
                                                        <div className="font-medium text-gray-900">{word.word}</div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="text-gray-700">{word.translation}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {importedData.length > 20 && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500 font-medium">
                                                        ... and {importedData.length - 20} more words
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                            <div className="text-sm text-gray-600">
                                Ready to import {importedData.length} word pairs
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isImporting}
                                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    {isImporting ? 'Importing...' : `Import ${importedData.length} Words`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
