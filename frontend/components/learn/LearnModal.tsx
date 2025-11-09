'use client';

import React, { useState, useEffect } from 'react';

interface LearnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (params: {
        hide: 'source' | 'target';
        limit: number | null;
        mode: 'flashcard' | 'input' | 'letters';
    }) => void;
    sourceLangName: string;
    targetLangName: string;
    availableWordsCount: number;
}

export default function LearnModal({ 
    isOpen, 
    onClose, 
    onStart, 
    sourceLangName, 
    targetLangName,
    availableWordsCount
}: LearnModalProps) {
    const [hide, setHide] = useState<'source' | 'target'>('target');
    const [limit, setLimit] = useState<number | null>(null);
    const [wordCount, setWordCount] = useState('10');
    const [wordCountError, setWordCountError] = useState('');
    const [mode, setMode] = useState<'flashcard' | 'input' | 'letters'>('flashcard');

    // Проверяем валидность при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            // Если доступно меньше 5 слов, сразу показываем предупреждение
            if (availableWordsCount < 5) {
                setWordCountError('At least 5 words are required for learning');
            } else {
                setWordCountError('');
            }
        }
    }, [isOpen, availableWordsCount]);

    // Проверяем валидность при изменении настроек
    useEffect(() => {
        if (isOpen && limit !== null) {
            const numCount = parseInt(wordCount);
            if (!isNaN(numCount) && numCount < 5) {
                setWordCountError('Please enter at least 5 words for learning');
            } else if (!isNaN(numCount) && numCount > availableWordsCount) {
                setWordCountError(`Only ${availableWordsCount} words available`);
            } else if (availableWordsCount >= 5) {
                setWordCountError('');
            }
        }
    }, [limit, wordCount, availableWordsCount, isOpen]);

    if (!isOpen) return null;

    const correctWordCount = () => {
        if (limit !== null) {
            const numCount = parseInt(wordCount);
            if (!isNaN(numCount)) {
                if (numCount < 5) {
                    setWordCountError('Please enter at least 5 words for learning');
                    return;
                }
                if (numCount > availableWordsCount) {
                    setWordCountError(`Only ${availableWordsCount} words available`);
                    return;
                }
            }
            setWordCountError('');
        }
    };

    const handleStart = () => {
        if (limit !== null) {
            const numCount = parseInt(wordCount);
            if (isNaN(numCount)) {
                setWordCountError('Please enter a valid number');
                return;
            }
            if (numCount < 5) {
                setWordCountError('Please enter at least 5 words for learning');
                return;
            }
            if (numCount > availableWordsCount) {
                setWordCountError(`Only ${availableWordsCount} words available`);
                return;
            }
            onStart({ hide, limit: numCount, mode });
        } else {
            // Проверяем, что доступно минимум 5 слов для режима "All"
            if (availableWordsCount < 5) {
                setWordCountError('At least 5 words are required for learning');
                return;
            }
            onStart({ hide, limit: null, mode });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Start Learning</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">
                        Learning: <span className="font-medium">{sourceLangName}</span> → <span className="font-medium">{targetLangName}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Learning Mode:
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="flashcard"
                                    checked={mode === 'flashcard'}
                                    onChange={(e) => setMode(e.target.value as 'flashcard' | 'input' | 'letters')}
                                    className="mr-2"
                                />
                                Flashcards
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="input"
                                    checked={mode === 'input'}
                                    onChange={(e) => setMode(e.target.value as 'flashcard' | 'input' | 'letters')}
                                    className="mr-2"
                                />
                                Type Words
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="letters"
                                    checked={mode === 'letters'}
                                    onChange={(e) => setMode(e.target.value as 'flashcard' | 'input' | 'letters')}
                                    className="mr-2"
                                />
                                Letter Squares
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hide:
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="hide"
                                    value="source"
                                    checked={hide === 'source'}
                                    onChange={(e) => setHide(e.target.value as 'source' | 'target')}
                                    className="mr-2"
                                />
                                Source ({sourceLangName})
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="hide"
                                    value="target"
                                    checked={hide === 'target'}
                                    onChange={(e) => setHide(e.target.value as 'source' | 'target')}
                                    className="mr-2"
                                />
                                Target ({targetLangName})
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Words:
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="words"
                                    value="all"
                                    checked={limit === null}
                                    onChange={() => setLimit(null)}
                                    className="mr-2"
                                />
                                All
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="words"
                                    value="count"
                                    checked={limit !== null}
                                    onChange={() => setLimit(20)}
                                    className="mr-2"
                                />
                                Count
                            </label>
                            {limit !== null && (
                                <div>
                                    <input
                                        type="number"
                                        value={wordCount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setWordCount(value);
                                            
                                            // Валидация в реальном времени
                                            const numCount = parseInt(value);
                                            if (value && !isNaN(numCount)) {
                                                if (numCount < 5) {
                                                    setWordCountError('Please enter at least 5 words for learning');
                                                } else if (numCount > availableWordsCount) {
                                                    setWordCountError(`Only ${availableWordsCount} words available`);
                                                } else {
                                                    setWordCountError('');
                                                }
                                            } else if (value) {
                                                setWordCountError('Please enter a valid number');
                                            } else {
                                                setWordCountError('');
                                            }
                                        }}
                                        onBlur={correctWordCount}
                                        className={`border rounded px-2 py-1 w-20 ${
                                            wordCountError 
                                                ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                        }`}
                                        min="5"
                                        max={availableWordsCount}
                                    />
                                    {wordCountError && (
                                        <div className="text-red-600 text-xs mt-1 font-medium">
                                            ⚠️ {wordCountError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {wordCountError && limit === null && (
                            <div className="text-red-600 text-xs mt-2 font-medium">
                                ⚠️ {wordCountError}
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        className={`px-4 py-2 rounded-md transition-colors ${
                            wordCountError 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={!!wordCountError}
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    );
}
