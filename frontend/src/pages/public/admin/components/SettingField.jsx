// components/admin/SettingField.jsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useAppSelector } from "@/features/store";
import { useUpdateSettingMutation } from "@/features/apis/api";
import { toast } from "react-toastify";

const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-800" : "bg-white",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        bgInput: isDarkMode ? "bg-gray-700" : "bg-white",
        borderInput: isDarkMode ? "border-gray-600" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        hover: isDarkMode ? "hover:shadow-gray-800" : "hover:shadow-md",
        bgHover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
        codeBg: isDarkMode ? "bg-gray-700" : "bg-gray-100",
        codeText: isDarkMode ? "text-gray-300" : "text-gray-700",
        toggleBg: isDarkMode ? "bg-gray-700" : "bg-gray-100",
    };
};

export default function SettingField({ setting, onSettingChange }) {
    const theme = useTheme();
    const [updateSetting] = useUpdateSettingMutation();

    const { key, value, type, label, description, isPublic } = setting;

    const handleValueChange = (newValue) => {
        onSettingChange(key, newValue);
    };

    const handleTogglePublic = async (checked) => {
        try {
            await updateSetting({
                key,
                value: setting.value,
                type: setting.type || 'string',
                category: setting.category || 'general',
                label: setting.label || key,
                isPublic: checked
            }).unwrap();
            toast.success("Visibility updated successfully");
            onSettingChange(key, { ...setting, isPublic: checked });
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update visibility");
        }
    };

    const renderField = () => {
        const commonProps = {
            value: value || '',
            onChange: (e) => handleValueChange(e.target.value),
            className: `w-full ${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white placeholder:text-gray-500`
        };

        switch (type) {
            case 'boolean':
                return (
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.toggleBg}`}>
                        <div>
                            <Label className={`text-base font-medium ${theme.text}`}>{label}</Label>
                            {description && (
                                <p className={`text-sm ${theme.textMuted} mt-1`}>{description}</p>
                            )}
                        </div>
                        <Switch
                            checked={Boolean(value)}
                            onCheckedChange={handleValueChange}
                        />
                    </div>
                );

            case 'textarea':
            case 'array':
                return (
                    <div className="space-y-2">
                        <Label className={`font-medium ${theme.text}`}>{label}</Label>
                        <Textarea
                            rows={type === 'array' ? 3 : 4}
                            {...commonProps}
                            placeholder={type === 'array' ? "e.g., value1, value2, value3" : `Enter ${label.toLowerCase()}`}
                            className={`${commonProps.className} resize-none`}
                        />
                        {description && (
                            <p className={`text-sm ${theme.textMuted} flex items-start gap-1`}>
                                <span>{description}</span>
                                {type === 'array' && <span className="text-xs">(comma-separated values)</span>}
                            </p>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="space-y-2">
                        <Label className={`font-medium ${theme.text}`}>{label}</Label>
                        <Input
                            {...commonProps}
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                        {description && (
                            <p className={`text-sm ${theme.textMuted} flex items-start gap-1`}>
                                <span>{description}</span>
                            </p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className={`space-y-4 p-4 border rounded-lg relative ${theme.border} ${theme.hover} transition-shadow`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-mono ${theme.codeBg} ${theme.codeText} px-2 py-1 rounded`}>
                            {key}
                        </span>
                        <span className={`text-xs ${theme.textMuted}`}>{type}</span>
                        {isPublic && (
                            <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                Public
                            </span>
                        )}
                    </div>
                    {renderField()}
                </div>
            </div>

            <div className={`flex items-center justify-between pt-2 border-t ${theme.border}`}>
                <div className={`text-sm ${theme.textMuted}`}>
                    {isPublic ? '🔓 Public - Visible to all visitors' : '🔒 Admin only - Visible to administrators'}
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-sm">Public</Label>
                    <Switch
                        checked={isPublic || false}
                        onCheckedChange={handleTogglePublic}
                    />
                </div>
            </div>
        </div>
    );
}