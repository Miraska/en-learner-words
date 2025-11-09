'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type WordItem = { id: number; word: string; translation: string };
export function Flashcard({
    word,
    onResult,
    onPrev,
    onNext,
    onLearn,
    isFirst,
}: {
    word: WordItem;
    onResult: (result: 'recalled' | 'notRecalled' | 'unknown') => void;
    onPrev: () => void;
    onNext: () => void;
    onLearn: () => void;
    isFirst: boolean;
}) {
    const [showTranslation, setShowTranslation] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);

    useEffect(() => {
        setShowTranslation(false);
        setHintUsed(false);
    }, [word?.id]);

    // Keyboard controls: Left = prev, Right = next, Enter = show translation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (!isFirst) onPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onNext();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                setShowTranslation(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onPrev, onNext, onLearn, isFirst]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="w-96 text-center">
                <h2 className="text-2xl font-bold mb-4">{word.word}</h2>
                {showTranslation && (
                    <p className="text-lg mb-4">{word.translation}</p>
                )}
                {/* Controls */}
                <div className="flex flex-col items-center gap-3">
                    {/* Show Translation */}
                    <div className="flex items-center gap-2">
                        {!showTranslation && (
                            <Button onClick={() => setShowTranslation(true)} title="Show translation (Enter)">
                                Show Translation
                            </Button>
                        )}
                    </div>

                    {/* Bottom row: Left / Right */}
                    <div className="grid grid-cols-3 items-center gap-2 w-full">
                        <div className="justify-self-start">
                            {!isFirst ? (
                                <Button onClick={onPrev} title="Prev (Arrow Left)">Prev</Button>
                            ) : (
                                <div />
                            )}
                        </div>
                        <div className="justify-self-center" />
                        <div className="justify-self-end">
                            <Button onClick={onNext} title="Next (Arrow Right)">Next</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
