// src/hooks/finance/useFinanceTheme.js
import { useMemo } from 'react';
import { useAppSelector } from '@/features/store';

/**
 * Finance module theme tokens.
 * Every finance component reads from this to stay consistent.
 *
 * Usage:
 *   const theme = useFinanceTheme();
 *   <div className={theme.text}>...</div>
 */
export function useFinanceTheme() {
    const isDarkMode = useAppSelector((s) => s.global.isDarkMode);

    return useMemo(() => ({
        isDarkMode,

        // Text
        text:         isDarkMode ? 'text-white' : 'text-gray-900',
        textSoft:     isDarkMode ? 'text-gray-300' : 'text-gray-700',
        textMuted:    isDarkMode ? 'text-gray-400' : 'text-gray-500',
        textFaint:    isDarkMode ? 'text-gray-500' : 'text-gray-400',

        // Surfaces
        card:         isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200',
        cardSolid:    isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        cardHover:    isDarkMode ? 'hover:border-gray-700' : 'hover:border-gray-300',
        surface:      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50',
        surfaceSolid: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',

        // Borders
        border:       isDarkMode ? 'border-gray-800' : 'border-gray-200',
        borderSoft:   isDarkMode ? 'border-gray-700' : 'border-gray-300',
        divider:      isDarkMode ? 'divide-gray-800' : 'divide-gray-100',

        // Row hover
        row:          isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
        rowEven:      isDarkMode ? 'bg-gray-900/30' : 'bg-white',
        rowOdd:       isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50',

        // Inputs
        input: isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
            : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400',
        select: isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900',
        selectContent: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white',
        selectItem: isDarkMode
            ? 'text-gray-300 hover:bg-gray-700 focus:bg-gray-700'
            : 'text-gray-900 hover:bg-gray-100 focus:bg-gray-100',

        // Buttons
        outlineBtn: isDarkMode
            ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50',
        ghostBtn: isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        destructiveBtn: isDarkMode
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30'
            : 'bg-red-600 text-white hover:bg-red-700',

        // Icons
        iconBox: isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500',

        // Dialog / Modal
        dialog: isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200',

        // Table header
        tableHeader: isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50',

        // Loading
        spinner: isDarkMode ? 'border-blue-400' : 'border-blue-600',
    }), [isDarkMode]);
}