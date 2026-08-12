// components/admin/AnnouncementForm.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from "@/features/apis/api";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const CATEGORIES = [
    'general', 'academic', 'event', 'holiday', 'exam', 'sports', 'important'
];

const PRIORITIES = [
    'low', 'medium', 'high', 'urgent'
];

const TARGET_AUDIENCES = [
    'students', 'teachers', 'parents', 'all'
];

// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        bgSubtle: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
        bgHover: isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        switch: isDarkMode ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" : "",
        tabs: {
            list: isDarkMode ? "bg-gray-800" : "bg-gray-100",
            trigger: isDarkMode 
                ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white" 
                : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900",
        },
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        badge: {
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            default: isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-blue-700",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
        toggleContainer: isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200",
    };
};

export default function AnnouncementForm({
    open,
    onOpenChange,
    initialData
}) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = React.useState("content");

    const [createAnnouncement, { isLoading: creating }] = useCreateAnnouncementMutation();
    const [updateAnnouncement, { isLoading: updating }] = useUpdateAnnouncementMutation();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            content: "",
            excerpt: "",
            category: "general",
            priority: "medium",
            isPublished: false,
            isPinned: false,
            startDate: new Date().toISOString().split('T')[0],
            endDate: "",
            targetAudience: ["all"]
        }
    });

    const isPublished = watch("isPublished");
    const targetAudience = watch("targetAudience") || [];

    useEffect(() => {
        if (open) {
            if (initialData) {
                const startDate = initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "";
                const endDate = initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "";

                reset({
                    title: initialData.title || "",
                    content: initialData.content || "",
                    excerpt: initialData.excerpt || "",
                    category: initialData.category || "general",
                    priority: initialData.priority || "medium",
                    isPublished: initialData.isPublished || false,
                    isPinned: initialData.isPinned || false,
                    startDate: startDate,
                    endDate: endDate,
                    targetAudience: initialData.targetAudience || ["all"]
                });
            } else {
                reset({
                    title: "",
                    content: "",
                    excerpt: "",
                    category: "general",
                    priority: "medium",
                    isPublished: false,
                    isPinned: false,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: "",
                    targetAudience: ["all"]
                });
            }
        }
    }, [open, initialData, reset]);

    const onSubmit = async (data) => {
        try {
            const audience = Array.isArray(data.targetAudience) ? data.targetAudience : [data.targetAudience];

            const announcementData = {
                ...data,
                targetAudience: audience,
                endDate: data.endDate || null
            };

            if (initialData) {
                await updateAnnouncement({ id: initialData._id, ...announcementData }).unwrap();
                toast.success("Announcement updated successfully");
            } else {
                await createAnnouncement(announcementData).unwrap();
                toast.success("Announcement created successfully");
            }
            onOpenChange(false);
        } catch (err) {
            console.error("Error saving announcement:", err);
            handleApiError(err || "Error saving announcement");
        }
    };

    const toggleAudience = (audience) => {
        const current = targetAudience;
        if (current.includes(audience)) {
            setValue("targetAudience", current.filter(a => a !== audience));
        } else {
            setValue("targetAudience", [...current, audience]);
        }
    };

    const isLoading = creating || updating;

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[700px] max-h-[90vh] overflow-y-auto ${theme.bg} ${theme.text}`}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>
                        {initialData ? "Edit Announcement" : "Create New Announcement"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className={`grid w-full grid-cols-3 ${theme.tabs.list}`}>
                            <TabsTrigger value="content" className={theme.tabs.trigger}>Content</TabsTrigger>
                            <TabsTrigger value="settings" className={theme.tabs.trigger}>Settings</TabsTrigger>
                            <TabsTrigger value="audience" className={theme.tabs.trigger}>Audience</TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Content */}
                        <TabsContent value="content" className="space-y-4 mt-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Announcement Title *</Label>
                                <Input
                                    {...register("title", {
                                        required: "Title is required",
                                        minLength: {
                                            value: 3,
                                            message: "Title must be at least 3 characters"
                                        }
                                    })}
                                    placeholder="e.g., School Holiday Announcement"
                                    className={`${inputClass} ${errors.title ? "border-red-500" : ""}`}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            {/* Excerpt */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Excerpt</Label>
                                <Textarea
                                    {...register("excerpt")}
                                    placeholder="Brief summary of the announcement (optional)"
                                    rows={3}
                                    className={`${inputClass} resize-none`}
                                />
                                <p className={`text-xs ${theme.textMuted}`}>
                                    Short summary used in listings and notifications.
                                </p>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Content *</Label>
                                <Textarea
                                    {...register("content", {
                                        required: "Content is required",
                                        minLength: {
                                            value: 10,
                                            message: "Content must be at least 10 characters"
                                        }
                                    })}
                                    placeholder="Full announcement content..."
                                    rows={8}
                                    className={`${inputClass} resize-none ${errors.content ? "border-red-500" : ""}`}
                                />
                                {errors.content && (
                                    <p className="text-sm text-red-500">{errors.content.message}</p>
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab 2: Settings */}
                        <TabsContent value="settings" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>Category</Label>
                                    <Select
                                        onValueChange={(value) => setValue("category", value)}
                                        value={watch("category")}
                                    >
                                        <SelectTrigger className={theme.select.trigger}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className={theme.select.content}>
                                            {CATEGORIES.map(category => (
                                                <SelectItem key={category} value={category} className={theme.select.item}>
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>Priority</Label>
                                    <Select
                                        onValueChange={(value) => setValue("priority", value)}
                                        value={watch("priority")}
                                    >
                                        <SelectTrigger className={theme.select.trigger}>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent className={theme.select.content}>
                                            {PRIORITIES.map(priority => (
                                                <SelectItem key={priority} value={priority} className={theme.select.item}>
                                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>Start Date *</Label>
                                    <Input
                                        type="date"
                                        {...register("startDate", { required: "Start date is required" })}
                                        className={`${inputClass} ${errors.startDate ? "border-red-500" : ""}`}
                                    />
                                    {errors.startDate && (
                                        <p className="text-sm text-red-500">{errors.startDate.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>End Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        {...register("endDate")}
                                        className={inputClass}
                                    />
                                    <p className={`text-xs ${theme.textMuted}`}>
                                        Leave empty if the announcement doesn't expire.
                                    </p>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4">
                                <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.toggleContainer}`}>
                                    <div>
                                        <Label className={`text-base ${theme.text}`}>Published</Label>
                                        <p className={`text-sm ${theme.textMuted}`}>
                                            {isPublished ? "Announcement is visible to public" : "Announcement is in draft mode"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isPublished}
                                        onCheckedChange={(checked) => setValue("isPublished", checked)}
                                        className={theme.switch}
                                    />
                                </div>

                                <div className={`flex items-center justify-between p-4 border rounded-lg ${theme.toggleContainer}`}>
                                    <div>
                                        <Label className={`text-base ${theme.text}`}>Pinned</Label>
                                        <p className={`text-sm ${theme.textMuted}`}>
                                            Pinned announcements appear at the top of the list
                                        </p>
                                    </div>
                                    <Switch
                                        checked={watch("isPinned")}
                                        onCheckedChange={(checked) => setValue("isPinned", checked)}
                                        className={theme.switch}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 3: Audience */}
                        <TabsContent value="audience" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Target Audience</Label>
                                <p className={`text-sm ${theme.textMuted}`}>
                                    Select who should see this announcement
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {TARGET_AUDIENCES.map(audience => {
                                        const isSelected = targetAudience.includes(audience);
                                        return (
                                            <Badge
                                                key={audience}
                                                variant={isSelected ? "default" : "outline"}
                                                className={`cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? theme.badge.default 
                                                        : theme.badge.outline
                                                }`}
                                                onClick={() => toggleAudience(audience)}
                                            >
                                                {audience}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className={`border-t ${theme.border} pt-4`}>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className={theme.button.outline}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className={theme.button.primary}
                        >
                            {isLoading ? "Saving..." : initialData ? "Update Announcement" : "Create Announcement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}