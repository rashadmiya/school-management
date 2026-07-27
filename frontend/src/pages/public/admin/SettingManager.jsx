// components/admin/SettingsManager.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { Save, RefreshCw, Globe, Mail, Phone, Share, Search } from "lucide-react";
import { useGetAdminSettingsQuery, useUpdateSettingMutation, useUpdateSettingsBulkMutation } from "@/features/apis/api";

const SETTING_CATEGORIES = [
    { id: 'general', name: 'General', icon: Globe, description: 'Basic school information' },
    { id: 'contact', name: 'Contact', icon: Phone, description: 'Contact information' },
    { id: 'social', name: 'Social Media', icon: Share, description: 'Social media links' },
    { id: 'appearance', name: 'Appearance', icon: Globe, description: 'Website appearance' },
    { id: 'seo', name: 'SEO', icon: Search, description: 'Search engine optimization' },
];

export default function SettingsManager() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [settings, setSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const { data, isLoading, refetch } = useGetAdminSettingsQuery();
    const [updateSettingsBulk] = useUpdateSettingsBulkMutation();
    const [updateSetting] = useUpdateSettingMutation();

    // Initialize settings from API data
    useEffect(() => {
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

    const handleSaveSingleSetting = async (key, value) => {
        try {
            await updateSetting({
                key,
                value,
                type: settings[key]?.type || 'string',
                category: settings[key]?.category || 'general',
                label: settings[key]?.label || key,
                isPublic: settings[key]?.isPublic || false
            }).unwrap();
            toast.success("Setting updated successfully");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update setting");
        }
    };

    const getSettingsByCategory = (category) => {
        return Object.values(settings).filter(setting => setting.category === category);
    };

    const renderSettingField = (setting) => {
        const { key, value, type, label, description, options, isPublic } = setting;

        const commonProps = {
            value: value || '',
            onChange: (e) => handleSettingChange(key, e.target.value),
            className: "w-full"
        };

        switch (type) {
            case 'boolean':
                return (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor={key} className="text-base">{label}</Label>
                            {description && (
                                <p className="text-sm text-gray-500">{description}</p>
                            )}
                        </div>
                        <Switch
                            checked={Boolean(value)}
                            onCheckedChange={(checked) => handleSettingChange(key, checked)}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Input
                            id={key}
                            type="number"
                            {...commonProps}
                        />
                        {description && (
                            <p className="text-sm text-gray-500">{description}</p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Textarea
                            id={key}
                            rows={4}
                            {...commonProps}
                        />
                        {description && (
                            <p className="text-sm text-gray-500">{description}</p>
                        )}
                    </div>
                );

            case 'array':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Textarea
                            id={key}
                            placeholder="Enter values separated by commas"
                            {...commonProps}
                        />
                        {description && (
                            <p className="text-sm text-gray-500">
                                {description} (comma-separated values)
                            </p>
                        )}
                    </div>
                );

            default: // string
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Input
                            id={key}
                            {...commonProps}
                        />
                        {description && (
                            <p className="text-sm text-gray-500">{description}</p>
                        )}
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Loading settings...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl">Site Settings</CardTitle>
                            <CardDescription>
                                Manage your school website settings and configuration
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="flex items-center gap-2"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? "Saving..." : "Save All Changes"}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories Sidebar */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1">
                            {SETTING_CATEGORIES.map((category) => {
                                const Icon = category.icon;
                                const categorySettings = getSettingsByCategory(category.id);

                                return (
                                    <button
                                        key={category.id}
                                        className={`w-full text-left p-4 border-l-4 transition-colors ${activeCategory === category.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-transparent hover:bg-gray-50'
                                            }`}
                                        onClick={() => setActiveCategory(category.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5" />
                                            <div className="flex-1">
                                                <div className="font-medium">{category.name}</div>
                                                <div className="text-sm text-gray-500">
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

                {/* Settings Content */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>
                            {SETTING_CATEGORIES.find(cat => cat.id === activeCategory)?.name} Settings
                        </CardTitle>
                        <CardDescription>
                            {SETTING_CATEGORIES.find(cat => cat.id === activeCategory)?.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {getSettingsByCategory(activeCategory).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No settings found for this category.</p>
                                    <p className="text-sm">Settings will appear here as they are added.</p>
                                </div>
                            ) : (
                                getSettingsByCategory(activeCategory).map((setting) => (
                                    <div key={setting.key} className="space-y-4 p-4 border rounded-lg">
                                        {renderSettingField(setting)}

                                        {/* Public visibility toggle */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="text-sm text-gray-500">
                                                {setting.isPublic ? 'Public setting' : 'Admin only'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`public-${setting.key}`} className="text-sm">
                                                    Public
                                                </Label>
                                                <Switch
                                                    id={`public-${setting.key}`}
                                                    checked={setting.isPublic || false}
                                                    onCheckedChange={(checked) =>
                                                        handleSaveSingleSetting(setting.key, { ...setting, isPublic: checked })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}