// components/admin/SettingsContent.jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SETTING_CATEGORIES } from "./settingsConstants";
import SettingField from "./SettingField";
import SuggestedSettings from "./SuggestedSettings";
import { useAppSelector } from "@/features/store";

const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        text: isDarkMode ? "text-white" : "text-gray-900",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        button: {
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
    };
};

export default function SettingsContent({ activeCategory, settings, onSettingChange, onAddNew }) {
    const theme = useTheme();

    const getSettingsByCategory = (category) => {
        return Object.values(settings).filter(setting => setting.category === category);
    };

    const categorySettings = getSettingsByCategory(activeCategory);
    const categoryInfo = SETTING_CATEGORIES.find(cat => cat.id === activeCategory);

    return (
        <Card className={`lg:col-span-3 ${theme.bgCard} ${theme.border} shadow-sm`}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className={theme.text}>
                            {categoryInfo?.name} Settings
                        </CardTitle>
                        <CardDescription className={theme.textMuted}>
                            {categoryInfo?.description}
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddNew}
                        className={`flex items-center gap-2 ${theme.button.outline}`}
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <SuggestedSettings
                        activeCategory={activeCategory}
                        settings={settings}
                        onAddSetting={onAddNew}
                    />

                    {categorySettings.length === 0 ? (
                        <div className={`text-center py-8 ${theme.textMuted}`}>
                            <p className="mb-4">No settings found for this category.</p>
                            <Button
                                variant="outline"
                                onClick={onAddNew}
                                className={`flex items-center gap-2 ${theme.button.outline}`}
                            >
                                <Plus className="w-4 h-4" />
                                Add Your First Setting
                            </Button>
                        </div>
                    ) : (
                        categorySettings.map((setting) => (
                            <SettingField
                                key={setting.key}
                                setting={setting}
                                onSettingChange={onSettingChange}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}