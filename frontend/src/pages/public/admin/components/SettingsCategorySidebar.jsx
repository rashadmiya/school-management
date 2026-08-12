// components/admin/SettingsCategorySidebar.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SETTING_CATEGORIES } from "./settingsConstants";
import { useAppSelector } from "@/features/store";

const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        text: isDarkMode ? "text-white" : "text-gray-900",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        bgHover: isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        activeBg: isDarkMode ? "bg-blue-500/20" : "bg-blue-50",
        activeText: isDarkMode ? "text-blue-400" : "text-blue-700",
        activeBorder: isDarkMode ? "border-blue-400" : "border-blue-500",
    };
};

export default function SettingsCategorySidebar({ activeCategory, onCategoryChange, settings }) {
    const theme = useTheme();

    const getSettingsByCategory = (category) => {
        return Object.values(settings).filter(setting => setting.category === category);
    };

    return (
        <Card className={`${theme.border} shadow-sm`}>
            <CardHeader>
                <CardTitle className={theme.text}>Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-1">
                    {SETTING_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === category.id;
                        const categorySettings = getSettingsByCategory(category.id);

                        return (
                            <button
                                key={category.id}
                                className={`w-full text-left p-4 border-l-4 transition-colors ${
                                    isActive
                                        ? `${theme.activeBorder} ${theme.activeBg} ${theme.activeText}`
                                        : `border-transparent ${theme.bgHover} ${theme.textMuted}`
                                }`}
                                onClick={() => onCategoryChange(category.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    <div className="flex-1">
                                        <div className={`font-medium ${isActive ? theme.activeText : theme.text}`}>
                                            {category.name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {categorySettings.length} settings
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}