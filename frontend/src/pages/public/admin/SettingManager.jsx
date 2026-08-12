// components/admin/SettingsManager.jsx
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Save, RefreshCw } from "lucide-react";
import { useGetAdminSettingsQuery, useUpdateSettingsBulkMutation } from "@/features/apis/api";
import { toast } from "react-toastify";
import { useAppSelector } from "@/features/store";
import SettingsCategorySidebar from "./components/SettingsCategorySidebar";
import SettingsContent from "./components/SettingsContent";
import CreateSettingDialog from "./components/CreateSettingDialog";
// import { SETTING_CATEGORIES } from "./settingsConstants";

// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
        },
    };
};

export default function SettingsManager() {
    const theme = useTheme();
    const [activeCategory, setActiveCategory] = useState('general');
    const [settings, setSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data, isLoading, refetch } = useGetAdminSettingsQuery();
    const [updateSettingsBulk] = useUpdateSettingsBulkMutation();

    // Initialize settings from API data
    React.useEffect(() => {
        if (data?.settings) {
            const settingsObj = {};
            data.settings.forEach(setting => {
                settingsObj[setting.key] = setting;
            });
            setSettings(settingsObj);
        }
    }, [data]);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                value: value
            }
        }));
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const settingsArray = Object.values(settings).map(setting => ({
                key: setting.key,
                value: setting.value
            }));
            await updateSettingsBulk(settingsArray).unwrap();
            toast.success("Settings saved successfully");
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const getSettingsByCategory = (category) => {
        return Object.values(settings).filter(setting => setting.category === category);
    };

    if (isLoading) {
        return (
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-6">
                    <div className={`text-center ${theme.textMuted}`}>Loading settings...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            {/* Header */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className={`text-2xl ${theme.text}`}>Site Settings</CardTitle>
                            <CardDescription className={theme.textMuted}>
                                Manage your school website settings and configuration
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsDialogOpen(true)}
                                className={`flex items-center gap-2 ${theme.button.primary}`}
                            >
                                <Plus className="w-4 h-4" />
                                Add New Setting
                            </Button>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className={`flex items-center gap-2 ${theme.button.primary}`}
                            >
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? "Saving..." : "Save All Changes"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories Sidebar */}
                <SettingsCategorySidebar
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    settings={settings}
                />

                {/* Settings Content */}
                <SettingsContent
                    activeCategory={activeCategory}
                    settings={settings}
                    onSettingChange={handleSettingChange}
                    onAddNew={() => setIsDialogOpen(true)}
                />
            </div>

            {/* Add New Setting Dialog */}
            <CreateSettingDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                settings={settings}
                activeCategory={activeCategory}
                onSettingCreated={(newSetting) => {
                    setSettings(prev => ({
                        ...prev,
                        [newSetting.key]: newSetting
                    }));
                }}
                onRefresh={refetch}
            />
        </div>
    );
}