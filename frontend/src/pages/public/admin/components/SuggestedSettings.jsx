// components/admin/SuggestedSettings.jsx
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { SETTING_EXAMPLES } from "./settingsConstants";
import { useAppSelector } from "@/features/store";

const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        text: isDarkMode ? "text-white" : "text-gray-900",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        bg: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
        border: isDarkMode ? "border-blue-400/30" : "border-blue-200",
        textBlue: isDarkMode ? "text-blue-400" : "text-blue-800",
        textBlueMuted: isDarkMode ? "text-blue-400/80" : "text-blue-600",
        button: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-blue-50",
    };
};

export default function SuggestedSettings({ activeCategory, settings, onAddSetting }) {
    const theme = useTheme();

    const categoryExamples = SETTING_EXAMPLES[activeCategory] || {};
    const existingKeys = Object.keys(settings);
    const suggestions = Object.keys(categoryExamples)
        .filter(key => !existingKeys.includes(key))
        .map(key => ({
            key,
            ...categoryExamples[key]
        }));

    if (suggestions.length === 0) return null;

    return (
        <div className={`mb-6 p-4 rounded-lg border ${theme.bg} ${theme.border}`}>
            <h4 className={`text-sm font-semibold ${theme.textBlue} mb-2 flex items-center gap-2`}>
                <AlertCircle className="w-4 h-4" />
                Suggested Settings
            </h4>
            <p className={`text-xs ${theme.textBlueMuted} mb-3`}>
                These are common settings for this category that haven't been added yet
            </p>
            <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 5).map((suggestion) => (
                    <Button
                        key={suggestion.key}
                        variant="outline"
                        size="sm"
                        onClick={() => onAddSetting()}
                        className={`text-xs ${theme.button}`}
                    >
                        + {suggestion.key.replace(/_/g, ' ')}
                    </Button>
                ))}
                {suggestions.length > 5 && (
                    <span className={`text-xs ${theme.textBlueMuted} flex items-center`}>
                        +{suggestions.length - 5} more
                    </span>
                )}
            </div>
        </div>
    );
}