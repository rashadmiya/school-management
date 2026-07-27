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

export default function AnnouncementForm({
    open,
    onOpenChange,
    initialData
}) {
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
                // Edit mode
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
                // Create mode
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
            // Convert targetAudience to array if it's a string (from select)
            const audience = Array.isArray(data.targetAudience) ? data.targetAudience : [data.targetAudience];

            const announcementData = {
                ...data,
                targetAudience: audience,
                // If endDate is empty, set to null
                endDate: data.endDate || null
            };

            if (initialData) {
                console.log("called update announcement")
                await updateAnnouncement({ id: initialData._id, ...announcementData }).unwrap();
                toast.success("Announcement updated successfully");
            } else {
                console.log("called create announcement")

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Announcement" : "Create New Announcement"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                            <TabsTrigger value="audience">Audience</TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="space-y-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Announcement Title *</Label>
                                <Input
                                    id="title"
                                    {...register("title", {
                                        required: "Title is required",
                                        minLength: {
                                            value: 3,
                                            message: "Title must be at least 3 characters"
                                        }
                                    })}
                                    placeholder="e.g., School Holiday Announcement"
                                    className={errors.title ? "border-red-500" : ""}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            {/* Excerpt */}
                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    {...register("excerpt")}
                                    placeholder="Brief summary of the announcement (optional)"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500">
                                    Short summary used in listings and notifications.
                                </p>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea
                                    id="content"
                                    {...register("content", {
                                        required: "Content is required",
                                        minLength: {
                                            value: 10,
                                            message: "Content must be at least 10 characters"
                                        }
                                    })}
                                    placeholder="Full announcement content..."
                                    rows={8}
                                    className={errors.content ? "border-red-500" : ""}
                                />
                                {errors.content && (
                                    <p className="text-sm text-red-500">{errors.content.message}</p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        onValueChange={(value) => setValue("category", value)}
                                        value={watch("category")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(category => (
                                                <SelectItem key={category} value={category}>
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority */}
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        onValueChange={(value) => setValue("priority", value)}
                                        value={watch("priority")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITIES.map(priority => (
                                                <SelectItem key={priority} value={priority}>
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
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        {...register("startDate", { required: "Start date is required" })}
                                        className={errors.startDate ? "border-red-500" : ""}
                                    />
                                    {errors.startDate && (
                                        <p className="text-sm text-red-500">{errors.startDate.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date (Optional)</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        {...register("endDate")}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Leave empty if the announcement doesn't expire.
                                    </p>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label htmlFor="isPublished" className="text-base">Published</Label>
                                        <p className="text-sm text-gray-500">
                                            {isPublished ? "Announcement is visible to public" : "Announcement is in draft mode"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isPublished}
                                        onCheckedChange={(checked) => setValue("isPublished", checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label htmlFor="isPinned" className="text-base">Pinned</Label>
                                        <p className="text-sm text-gray-500">
                                            Pinned announcements appear at the top of the list
                                        </p>
                                    </div>
                                    <Switch
                                        checked={watch("isPinned")}
                                        onCheckedChange={(checked) => setValue("isPinned", checked)}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="audience" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <p className="text-sm text-gray-500">
                                    Select who should see this announcement
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {TARGET_AUDIENCES.map(audience => (
                                        <Badge
                                            key={audience}
                                            variant={targetAudience.includes(audience) ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => toggleAudience(audience)}
                                        >
                                            {audience}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : initialData ? "Update Announcement" : "Create Announcement"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}