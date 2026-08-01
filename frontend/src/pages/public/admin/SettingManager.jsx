// components/admin/SettingsManager.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSettingMutation, useGetAdminSettingsQuery, useUpdateSettingMutation, useUpdateSettingsBulkMutation } from "@/features/apis/api";
import { AlertCircle, Globe, Info, Phone, Plus, RefreshCw, Save, Search, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const SETTING_CATEGORIES = [
    { id: 'general', name: 'General', icon: Globe, description: 'Basic school information' },
    { id: 'contact', name: 'Contact', icon: Phone, description: 'Contact information' },
    { id: 'social', name: 'Social Media', icon: Share, description: 'Social media links' },
    { id: 'appearance', name: 'Appearance', icon: Globe, description: 'Website appearance' },
    { id: 'seo', name: 'SEO', icon: Search, description: 'Search engine optimization' },
    { id: 'academic', name: 'Academic', icon: Globe, description: 'Academic settings' },
];

const SETTING_TYPES = [
    { value: 'string', label: 'Text', example: 'School Name', hint: 'Single line text input' },
    { value: 'number', label: 'Number', example: '2024', hint: 'Numeric values only' },
    { value: 'boolean', label: 'Toggle (On/Off)', example: 'true/false', hint: 'Enable or disable features' },
    { value: 'array', label: 'Array (Comma-separated)', example: 'value1, value2, value3', hint: 'Multiple values separated by commas' },
    { value: 'object', label: 'Object (JSON)', example: '{"key": "value"}', hint: 'Structured data in JSON format' },
    { value: 'file', label: 'File', example: 'image.png, document.pdf', hint: 'File uploads (images, documents)' },
];

const SETTING_EXAMPLES = {
    general: {
        SCHOOL_NAME: { value: 'Springfield Elementary School', description: 'The full name of your school' },
        SCHOOL_SHORT_NAME: { value: 'SES', description: 'Abbreviated name for logos and short displays' },
        SCHOOL_ADDRESS: { value: '123 Education St, Springfield, IL 62701', description: 'Physical address of the school' },
        SCHOOL_PHONE: { value: '+1 (555) 123-4567', description: 'Main contact phone number' },
        SCHOOL_EMAIL: { value: 'info@springfield.edu', description: 'General inquiry email address' },
        SCHOOL_YEAR: { value: '2024-2025', description: 'Current academic year' },
    },
    contact: {
        ADMISSIONS_EMAIL: { value: 'admissions@springfield.edu', description: 'Admissions department email' },
        ADMISSIONS_PHONE: { value: '+1 (555) 123-4568', description: 'Admissions phone number' },
        SUPPORT_EMAIL: { value: 'support@springfield.edu', description: 'Technical support email' },
        SUPPORT_PHONE: { value: '+1 (555) 123-4569', description: 'Technical support phone' },
        EMERGENCY_CONTACT: { value: '+1 (555) 123-4570', description: 'Emergency contact number' },
        OFFICE_HOURS: { value: 'Mon-Fri 8:00 AM - 5:00 PM', description: 'School office hours' },
    },
    social: {
        FACEBOOK_URL: { value: 'https://facebook.com/springfieldschool', description: 'Facebook page URL' },
        TWITTER_URL: { value: 'https://twitter.com/springfield_sch', description: 'Twitter/X profile URL' },
        INSTAGRAM_URL: { value: 'https://instagram.com/springfield.school', description: 'Instagram profile URL' },
        YOUTUBE_URL: { value: 'https://youtube.com/c/springfieldschool', description: 'YouTube channel URL' },
        LINKEDIN_URL: { value: 'https://linkedin.com/school/springfield-school', description: 'LinkedIn company page URL' },
    },
    appearance: {
        PRIMARY_COLOR: { value: '#4F46E5', description: 'Primary brand color (hex code)' },
        SECONDARY_COLOR: { value: '#7C3AED', description: 'Secondary brand color (hex code)' },
        HEADER_LAYOUT: { value: 'centered', description: 'Header layout style (centered, left, right)' },
        SITE_TAGLINE: { value: 'Excellence in Education', description: 'Tagline displayed below school name' },
        FOOTER_TEXT: { value: '© 2024 Springfield Elementary School. All rights reserved.', description: 'Copyright text in footer' },
    },
    seo: {
        SITE_TITLE: { value: 'Springfield Elementary School - Excellence in Education', description: 'Title tag for SEO' },
        META_DESCRIPTION: { value: 'Springfield Elementary School offers quality education from kindergarten through 8th grade. Enroll now!', description: 'Meta description for search results' },
        META_KEYWORDS: { value: 'elementary school, springfield, education, k-8, private school', description: 'Comma-separated keywords for SEO' },
        OG_IMAGE: { value: 'https://springfield.edu/og-image.jpg', description: 'Open Graph image URL for social sharing' },
        OG_TITLE: { value: 'Springfield Elementary School', description: 'Open Graph title for social sharing' },
    },
    academic: {
        TERM_START: { value: '2024-09-01', description: 'Start date of the current term' },
        TERM_END: { value: '2025-06-15', description: 'End date of the current term' },
        GRADING_SCALE: { value: 'A=90-100, B=80-89, C=70-79, D=60-69, F=0-59', description: 'Grading scale configuration' },
        CLASS_HOURS_PER_DAY: { value: '6', description: 'Number of class hours per day' },
        MAX_STUDENTS_PER_CLASS: { value: '30', description: 'Maximum students allowed per class' },
        CURRICULUM_DESCRIPTION: { value: 'Our curriculum follows state standards with emphasis on STEM, arts, and physical education.', description: 'Brief curriculum description' },
    }
};

export default function SettingsManager() {
    const [activeCategory, setActiveCategory] = useState('general');
    const [settings, setSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newSetting, setNewSetting] = useState({
        key: '',
        value: '',
        type: 'string',
        category: 'general',
        label: '',
        description: '',
        isPublic: false
    });
    const [suggestedSettings, setSuggestedSettings] = useState([]);

    const { data, isLoading, refetch } = useGetAdminSettingsQuery();
    const [updateSettingsBulk] = useUpdateSettingsBulkMutation();
    const [updateSetting] = useUpdateSettingMutation();
    const [createSetting] = useCreateSettingMutation();

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

    // Update suggested settings based on category and existing keys
    useEffect(() => {
        const categoryExamples = SETTING_EXAMPLES[activeCategory] || {};
        const existingKeys = Object.keys(settings);
        const suggestions = Object.keys(categoryExamples)
            .filter(key => !existingKeys.includes(key))
            .map(key => ({
                key,
                ...categoryExamples[key]
            }));
        setSuggestedSettings(suggestions);
    }, [activeCategory, settings]);

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

    const handleCreateSetting = async () => {
        if (!newSetting.key || !newSetting.label) {
            toast.error("Key and Label are required");
            return;
        }

        // Check if setting already exists
        if (settings[newSetting.key]) {
            toast.error(`Setting with key "${newSetting.key}" already exists`);
            return;
        }

        try {
            const settingToCreate = {
                ...newSetting,
                key: newSetting.key.toUpperCase().trim()
            };
            
            const result = await createSetting(settingToCreate).unwrap();
            toast.success(`Setting "${newSetting.label}" created successfully`);
            
            // Add to local state
            setSettings(prev => ({
                ...prev,
                [settingToCreate.key]: result.setting || settingToCreate
            }));
            
            // Reset form and close dialog
            resetNewSettingForm();
            setIsDialogOpen(false);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to create setting");
        }
    };

    const resetNewSettingForm = () => {
        setNewSetting({
            key: '',
            value: '',
            type: 'string',
            category: 'general',
            label: '',
            description: '',
            isPublic: false
        });
    };

    const handleDeleteSetting = async (key) => {
        if (!confirm(`Are you sure you want to delete setting "${key}"?`)) return;
        
        try {
            // You'll need to implement a delete endpoint
            // await deleteSetting(key).unwrap();
            
            // Remove from local state
            const newSettings = { ...settings };
            delete newSettings[key];
            setSettings(newSettings);
            
            toast.success(`Setting "${key}" deleted successfully`);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to delete setting");
        }
    };

    const getSettingsByCategory = (category) => {
        return Object.values(settings).filter(setting => setting.category === category);
    };

    const handleQuickAddSetting = (suggestion) => {
        setNewSetting({
            key: suggestion.key,
            value: suggestion.value,
            type: 'string',
            category: activeCategory,
            label: suggestion.key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: suggestion.description,
            isPublic: true
        });
        setIsDialogOpen(true);
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
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div>
                            <Label htmlFor={key} className="text-base font-medium">{label}</Label>
                            {description && (
                                <p className="text-sm text-gray-500 mt-1">{description}</p>
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
                        <Label htmlFor={key} className="font-medium">{label}</Label>
                        <Input
                            id={key}
                            type="number"
                            {...commonProps}
                            placeholder="Enter a numeric value"
                        />
                        {description && (
                            <p className="text-sm text-gray-500 flex items-start gap-1">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {description}
                            </p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key} className="font-medium">{label}</Label>
                        <Textarea
                            id={key}
                            rows={4}
                            {...commonProps}
                            placeholder="Enter detailed information..."
                        />
                        {description && (
                            <p className="text-sm text-gray-500 flex items-start gap-1">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {description}
                            </p>
                        )}
                    </div>
                );

            case 'array':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key} className="font-medium">{label}</Label>
                        <Textarea
                            id={key}
                            rows={3}
                            {...commonProps}
                            placeholder="e.g., value1, value2, value3"
                        />
                        {description && (
                            <p className="text-sm text-gray-500 flex items-start gap-1">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {description} (comma-separated values)
                            </p>
                        )}
                    </div>
                );

            default: // string
                return (
                    <div className="space-y-2">
                        <Label htmlFor={key} className="font-medium">{label}</Label>
                        <Input
                            id={key}
                            {...commonProps}
                            placeholder={`Enter ${label.toLowerCase()}`}
                        />
                        {description && (
                            <p className="text-sm text-gray-500 flex items-start gap-1">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {description}
                            </p>
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
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsDialogOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Setting
                            </Button>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="flex items-center gap-2"
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
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>
                                    {SETTING_CATEGORIES.find(cat => cat.id === activeCategory)?.name} Settings
                                </CardTitle>
                                <CardDescription>
                                    {SETTING_CATEGORIES.find(cat => cat.id === activeCategory)?.description}
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setNewSetting({ ...newSetting, category: activeCategory });
                                    setIsDialogOpen(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Suggested Settings */}
                            {suggestedSettings.length > 0 && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Suggested Settings
                                    </h4>
                                    <p className="text-xs text-blue-600 mb-3">
                                        These are common settings for this category that haven't been added yet
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedSettings.slice(0, 5).map((suggestion) => (
                                            <Button
                                                key={suggestion.key}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleQuickAddSetting(suggestion)}
                                                className="text-xs bg-white hover:bg-blue-50"
                                            >
                                                + {suggestion.key.replace(/_/g, ' ')}
                                            </Button>
                                        ))}
                                        {suggestedSettings.length > 5 && (
                                            <span className="text-xs text-blue-600 flex items-center">
                                                +{suggestedSettings.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {getSettingsByCategory(activeCategory).length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No settings found for this category.</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setNewSetting({ ...newSetting, category: activeCategory });
                                            setIsDialogOpen(true);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Your First Setting
                                    </Button>
                                </div>
                            ) : (
                                getSettingsByCategory(activeCategory).map((setting) => (
                                    <div key={setting.key} className="space-y-4 p-4 border rounded-lg relative hover:shadow-md transition-shadow">
                                        <button
                                            onClick={() => handleDeleteSetting(setting.key)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete setting"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                                        {setting.key}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {setting.type}
                                                    </span>
                                                    {setting.isPublic && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                            Public
                                                        </span>
                                                    )}
                                                </div>
                                                {renderSettingField(setting)}
                                            </div>
                                        </div>

                                        {/* Public visibility toggle */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="text-sm text-gray-500">
                                                {setting.isPublic ? '🔓 Public - Visible to all visitors' : '🔒 Admin only - Visible to administrators'}
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

            {/* Add New Setting Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Setting</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            Create a new configuration setting for your school website
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-key">Setting Key <span className="text-red-500">*</span></Label>
                            <Input
                                id="new-key"
                                value={newSetting.key}
                                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value.toUpperCase() })}
                                placeholder="e.g., SCHOOL_NAME"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Must be unique, uppercase, and use underscores for spaces
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="new-label">Display Label <span className="text-red-500">*</span></Label>
                            <Input
                                id="new-label"
                                value={newSetting.label}
                                onChange={(e) => setNewSetting({ ...newSetting, label: e.target.value })}
                                placeholder="e.g., School Name"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                This will be displayed as the field label in the settings panel
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="new-type">Setting Type</Label>
                            <Select
                                value={newSetting.type}
                                onValueChange={(value) => {
                                    setNewSetting({ ...newSetting, type: value, value: '' });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SETTING_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <div>
                                                <div>{type.label}</div>
                                                <div className="text-xs text-gray-500">{type.hint}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Choose the appropriate data type for your setting
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="new-category">Category</Label>
                            <Select
                                value={newSetting.category}
                                onValueChange={(value) => setNewSetting({ ...newSetting, category: value })}
                            >
                                <SelectTrigger>
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

                        <div>
                            <Label htmlFor="new-value">Default Value</Label>
                            {newSetting.type === 'boolean' ? (
                                <div className="flex items-center gap-4 mt-1">
                                    <Switch
                                        checked={newSetting.value === 'true' || newSetting.value === true}
                                        onCheckedChange={(checked) => setNewSetting({ ...newSetting, value: checked })}
                                    />
                                    <span className="text-sm">{newSetting.value ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            ) : (
                                <Input
                                    id="new-value"
                                    value={newSetting.value}
                                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                                    placeholder={`e.g., ${SETTING_TYPES.find(t => t.value === newSetting.type)?.example || ''}`}
                                    className="mt-1"
                                />
                            )}
                            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Set the initial value for this setting
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="new-description">Description</Label>
                            <Input
                                id="new-description"
                                value={newSetting.description}
                                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                                placeholder="Brief description of what this setting does"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Help other administrators understand the purpose of this setting
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                                <Label htmlFor="new-public" className="text-sm font-medium">Make Public</Label>
                                <p className="text-xs text-gray-500">Allow this setting to be visible to all visitors</p>
                            </div>
                            <Switch
                                id="new-public"
                                checked={newSetting.isPublic}
                                onCheckedChange={(checked) => setNewSetting({ ...newSetting, isPublic: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsDialogOpen(false);
                            resetNewSettingForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSetting}>
                            Create Setting
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}