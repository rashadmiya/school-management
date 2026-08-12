// components/admin/CreateSettingDialog.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateSettingMutation } from "@/features/apis/api";
import { useTheme } from "@/hooks/useTheme";
import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { SETTING_CATEGORIES, SETTING_TYPES } from "./settingsConstants";

export default function CreateSettingDialog({ open, onOpenChange, settings, activeCategory, onSettingCreated, onRefresh }) {
    const theme = useTheme();
    const [createSetting] = useCreateSettingMutation();
    const [errors, setErrors] = useState({});

    const [newSetting, setNewSetting] = useState({
        key: '',
        value: '',
        type: 'string',
        category: activeCategory || 'general',
        label: '',
        description: '',
        isPublic: false
    });

    const resetForm = () => {
        setNewSetting({
            key: '',
            value: '',
            type: 'string',
            category: activeCategory || 'general',
            label: '',
            description: '',
            isPublic: false
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};
        if (!newSetting.key.trim()) newErrors.key = "Setting key is required";
        if (!newSetting.label.trim()) newErrors.label = "Display label is required";
        if (settings[newSetting.key.toUpperCase().trim()]) {
            newErrors.key = `Setting "${newSetting.key.toUpperCase().trim()}" already exists`;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        try {
            const settingToCreate = {
                ...newSetting,
                key: newSetting.key.toUpperCase().trim()
            };

            const result = await createSetting(settingToCreate).unwrap();
            toast.success(`Setting "${newSetting.label}" created successfully`);
            onSettingCreated(result.setting || settingToCreate);
            resetForm();
            onOpenChange(false);
            onRefresh();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to create setting");
        }
    };

    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;
    const labelClass = `text-sm font-medium ${theme.textSecondary}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${theme.bg} ${theme.text}`}>
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className={`text-xl ${theme.text}`}>Add New Setting</DialogTitle>
                    <p className={`text-sm ${theme.textMuted}`}>
                        Create a new configuration setting for your school website
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1 py-4 space-y-5">
                    {/* Key & Label - Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelClass}>
                                Setting Key <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={newSetting.key}
                                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value.toUpperCase() })}
                                placeholder="e.g., SCHOOL_NAME"
                                className={`${inputClass} ${errors.key ? "border-red-500" : ""}`}
                            />
                            {errors.key ? (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.key}
                                </p>
                            ) : (
                                <p className={`text-xs ${theme.textMuted} flex items-start gap-1`}>
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    Unique, uppercase, underscores for spaces
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelClass}>
                                Display Label <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={newSetting.label}
                                onChange={(e) => setNewSetting({ ...newSetting, label: e.target.value })}
                                placeholder="e.g., School Name"
                                className={`${inputClass} ${errors.label ? "border-red-500" : ""}`}
                            />
                            {errors.label ? (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.label}
                                </p>
                            ) : (
                                <p className={`text-xs ${theme.textMuted} flex items-start gap-1`}>
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    Displayed as the field label in settings panel
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Type & Category - Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelClass}>Setting Type</Label>
                            <Select
                                value={newSetting.type}
                                onValueChange={(value) => setNewSetting({ ...newSetting, type: value, value: '' })}
                            >
                                <SelectTrigger className={`${inputClass}`}>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SETTING_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div>
                                                <div>{type.label}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{type.hint}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className={`text-xs ${theme.textMuted} flex items-start gap-1`}>
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Choose the appropriate data type
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className={labelClass}>Category</Label>
                            <Select
                                value={newSetting.category}
                                onValueChange={(value) => setNewSetting({ ...newSetting, category: value })}
                            >
                                <SelectTrigger className={`${inputClass}`}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SETTING_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Value - Row 3 (Full Width) */}
                    <div className="space-y-1.5">
                        <Label className={labelClass}>Default Value</Label>
                        {newSetting.type === 'boolean' ? (
                            <div className={`flex items-center gap-4 p-3 rounded-lg border ${theme.bgSubtle} ${theme.border}`}>
                                <Switch
                                    checked={newSetting.value === 'true' || newSetting.value === true}
                                    onCheckedChange={(checked) => setNewSetting({ ...newSetting, value: checked })}
                                    className={theme.switch}
                                />
                                <span className={`text-sm ${theme.textMuted}`}>
                                    {newSetting.value ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        ) : (
                            <Input
                                value={newSetting.value}
                                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                                placeholder={`e.g., ${SETTING_TYPES.find(t => t.value === newSetting.type)?.example || ''}`}
                                className={inputClass}
                            />
                        )}
                        <p className={`text-xs ${theme.textMuted} flex items-start gap-1`}>
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Set the initial value for this setting
                        </p>
                    </div>

                    {/* Description - Row 4 (Full Width) */}
                    <div className="space-y-1.5">
                        <Label className={labelClass}>Description</Label>
                        <Input
                            value={newSetting.description}
                            onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                            placeholder="Brief description of what this setting does"
                            className={inputClass}
                        />
                        <p className={`text-xs ${theme.textMuted} flex items-start gap-1`}>
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Help other administrators understand the purpose
                        </p>
                    </div>

                    {/* Public Toggle - Row 5 */}
                    <div className={`flex items-center justify-between p-3 border rounded-lg ${theme.bgSubtle} ${theme.border}`}>
                        <div>
                            <Label className={`text-sm font-medium ${theme.textSecondary}`}>Make Public</Label>
                            <p className={`text-xs ${theme.textMuted}`}>Allow this setting to be visible to all visitors</p>
                        </div>
                        <Switch
                            checked={newSetting.isPublic}
                            onCheckedChange={(checked) => setNewSetting({ ...newSetting, isPublic: checked })}
                            className={theme.switch}
                        />
                    </div>

                    {/* Validation Alert */}
                    {Object.keys(errors).length > 0 && (
                        <Alert variant="destructive" className={theme.alert}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please fix the errors above before submitting
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className={`flex-shrink-0 pt-4 border-t ${theme.border}`}>
                    <Button
                        variant="outline"
                        onClick={() => { onOpenChange(false); resetForm(); }}
                        className={theme.button.outline}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} className={theme.button.primary}>
                        Create Setting
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}