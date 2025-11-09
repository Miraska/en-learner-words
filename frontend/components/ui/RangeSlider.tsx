'use client';
import { useState, useRef, useEffect } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    onInputChange?: (value: [number, number]) => void;
    className?: string;
}

export default function RangeSlider({
    min,
    max,
    step,
    value,
    onChange,
    onInputChange,
    className = '',
}: RangeSliderProps) {
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const getPercentage = (val: number) => {
        return ((val - min) / (max - min)) * 100;
    };

    const getValueFromPercentage = (percentage: number) => {
        return min + (percentage / 100) * (max - min);
    };

    const handleMouseDown = (e: React.MouseEvent, thumb: 'min' | 'max') => {
        e.preventDefault();
        setIsDragging(thumb);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const newValue = Math.round(getValueFromPercentage(percentage) / step) * step;

        if (isDragging === 'min') {
            const newMin = Math.max(min, Math.min(newValue, value[1] - step));
            onChange([newMin, value[1]]);
        } else {
            const newMax = Math.min(max, Math.max(newValue, value[0] + step));
            onChange([value[0], newMax]);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, value]);

    return (
        <div className={`relative ${className}`}>
            {/* Инпуты для ручного ввода */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                    <input
                        id="range-min"
                        name="range-min"
                        type="number"
                        min={min}
                        max={value[1] - step}
                        step={step}
                        value={value[0]}
                        onChange={(e) => {
                            const newMin = Math.max(min, Math.min(Number(e.target.value), value[1] - step));
                            const newValue = [newMin, value[1]] as [number, number];
                            onChange(newValue);
                            if (onInputChange) onInputChange(newValue);
                        }}
                        autoComplete="off"
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">%</span>
                </div>
                <span className="text-sm text-gray-400">—</span>
                <div className="flex items-center gap-1">
                    <input
                        id="range-max"
                        name="range-max"
                        type="number"
                        min={value[0] + step}
                        max={max}
                        step={step}
                        value={value[1]}
                        onChange={(e) => {
                            const newMax = Math.min(max, Math.max(Number(e.target.value), value[0] + step));
                            const newValue = [value[0], newMax] as [number, number];
                            onChange(newValue);
                            if (onInputChange) onInputChange(newValue);
                        }}
                        autoComplete="off"
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">%</span>
                </div>
            </div>

            {/* Ползунок */}
            <div
                ref={sliderRef}
                className="relative h-1.5 bg-gray-200 rounded-full cursor-pointer w-64"
                onMouseDown={(e) => {
                    const rect = sliderRef.current!.getBoundingClientRect();
                    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                    const newValue = Math.round(getValueFromPercentage(percentage) / step) * step;
                    
                    // Определяем, какой ползунок ближе
                    const minDistance = Math.abs(newValue - value[0]);
                    const maxDistance = Math.abs(newValue - value[1]);
                    
                    if (minDistance < maxDistance) {
                        const newMin = Math.max(min, Math.min(newValue, value[1] - step));
                        onChange([newMin, value[1]]);
                    } else {
                        const newMax = Math.min(max, Math.max(newValue, value[0] + step));
                        onChange([value[0], newMax]);
                    }
                }}
            >
                {/* Активная область между ползунками */}
                <div
                    className="absolute h-1.5 bg-blue-500 rounded-full"
                    style={{
                        left: `${getPercentage(value[0])}%`,
                        width: `${getPercentage(value[1]) - getPercentage(value[0])}%`,
                    }}
                />
                
                {/* Минимальный ползунок */}
                <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer transform -translate-y-0.5 -translate-x-1.5 hover:bg-blue-600 transition-colors"
                    style={{ left: `${getPercentage(value[0])}%` }}
                    onMouseDown={(e) => handleMouseDown(e, 'min')}
                />
                
                {/* Максимальный ползунок */}
                <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer transform -translate-y-0.5 -translate-x-1.5 hover:bg-blue-600 transition-colors"
                    style={{ left: `${getPercentage(value[1])}%` }}
                    onMouseDown={(e) => handleMouseDown(e, 'max')}
                />
            </div>
        </div>
    );
}
