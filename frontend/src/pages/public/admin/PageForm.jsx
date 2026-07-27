// components/admin/PageForm.jsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
// import { useCreatePageMutation, useUpdatePageMutation } from "@/features/apis/adminPublicApi";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { useCreatePageMutation, useUpdatePageMutation } from "@/features/apis/api";

export default function PageForm({
    open,
    onOpenChange,
    initialData
}) {
    const [activeTab, setActiveTab] = useState("content");
    const [sections, setSections] = useState([]);

    const [createPage, { isLoading: creating }] = useCreatePageMutation();
    const [updatePage, { isLoading: updating }] = useUpdatePageMutation();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            slug: "",
            content: "",
            excerpt: "",
            metaTitle: "",
            metaDescription: "",
            featuredImage: "",
            isPublished: true,
            order: 0
        }
    });

    const isPublished = watch("isPublished");

    useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit mode
                reset({
                    title: initialData.title || "",
                    slug: initialData.slug || "",
                    content: initialData.content || "",
                    excerpt: initialData.excerpt || "",
                    metaTitle: initialData.metaTitle || "",
                    metaDescription: initialData.metaDescription || "",
                    featuredImage: initialData.featuredImage || "",
                    isPublished: initialData.isPublished !== undefined ? initialData.isPublished : true,
                    order: initialData.order || 0
                });
                setSections(initialData.sections || []);
            } else {
                // Create mode
                reset({
                    title: "",
                    slug: "",
                    content: "",
                    excerpt: "",
                    metaTitle: "",
                    metaDescription: "",
                    featuredImage: "",
                    isPublished: true,
                    order: 0
                });
                setSections([]);
            }
        }
    }, [open, initialData, reset]);

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setValue("title", title);

        // Auto-generate slug if empty or matches the generated version of current title
        if (!watch("slug") || watch("slug") === generateSlug(watch("title"))) {
            setValue("slug", generateSlug(title));
        }
    };

    const onSubmit = async (data) => {
        try {
            const pageData = {
                ...data,
                sections: sections
            };

            if (initialData) {
                await updatePage({ id: initialData._id, ...pageData }).unwrap();
                toast.success("Page updated successfully");
            } else {
                await createPage(pageData).unwrap();
                toast.success("Page created successfully");
            }
            onOpenChange(false);
        } catch (err) {
            console.error("Error saving page:", err);
            toast.error(err?.data?.message || "Error saving page");
        }
    };

    const addSection = (type) => {
        const newSection = {
            type,
            title: "",
            subtitle: "",
            content: "",
            image: "",
            data: {},
            order: sections.length
        };
        setSections([...sections, newSection]);
    };

    const updateSection = (index, field, value) => {
        const updatedSections = [...sections];
        updatedSections[index][field] = value;
        setSections(updatedSections);
    };

    const removeSection = (index) => {
        const updatedSections = sections.filter((_, i) => i !== index);
        setSections(updatedSections);
    };

    const moveSection = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === sections.length - 1)) return;

        const updatedSections = [...sections];
        const temp = updatedSections[index];
        updatedSections[index] = updatedSections[index + direction];
        updatedSections[index + direction] = temp;

        // Update orders
        updatedSections.forEach((section, i) => {
            section.order = i;
        });

        setSections(updatedSections);
    };

    const isLoading = creating || updating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Page" : "Create New Page"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="seo">SEO</TabsTrigger>
                            <TabsTrigger value="sections">Sections</TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="space-y-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Page Title *</Label>
                                <Input
                                    id="title"
                                    {...register("title", {
                                        required: "Page title is required",
                                        minLength: {
                                            value: 3,
                                            message: "Title must be at least 3 characters"
                                        }
                                    })}
                                    onChange={handleTitleChange}
                                    placeholder="e.g., About Us, Contact Information"
                                    className={errors.title ? "border-red-500" : ""}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            {/* Slug */}
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug *</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">/</span>
                                    <Input
                                        id="slug"
                                        {...register("slug", {
                                            required: "Slug is required",
                                            pattern: {
                                                value: /^[a-z0-9-]+$/,
                                                message: "Slug can only contain lowercase letters, numbers, and hyphens"
                                            }
                                        })}
                                        placeholder="about-us, contact"
                                        className={errors.slug ? "border-red-500" : ""}
                                    />
                                </div>
                                {errors.slug && (
                                    <p className="text-sm text-red-500">{errors.slug.message}</p>
                                )}
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <Label htmlFor="content">Page Content *</Label>
                                <Textarea
                                    id="content"
                                    {...register("content", {
                                        required: "Content is required",
                                        minLength: {
                                            value: 10,
                                            message: "Content must be at least 10 characters"
                                        }
                                    })}
                                    placeholder="Main content of the page..."
                                    rows={8}
                                    className={errors.content ? "border-red-500" : ""}
                                />
                                {errors.content && (
                                    <p className="text-sm text-red-500">{errors.content.message}</p>
                                )}
                            </div>

                            {/* Excerpt */}
                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    {...register("excerpt")}
                                    placeholder="Brief description of the page (optional)"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500">
                                    Short summary used in listings and search results.
                                </p>
                            </div>

                            {/* Settings */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label htmlFor="isPublished" className="text-base">Published</Label>
                                    <p className="text-sm text-gray-500">
                                        {isPublished ? "Page is visible to public" : "Page is in draft mode"}
                                    </p>
                                </div>
                                <Switch
                                    checked={isPublished}
                                    onCheckedChange={(checked) => setValue("isPublished", checked)}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="seo" className="space-y-4">
                            {/* Meta Title */}
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">Meta Title</Label>
                                <Input
                                    id="metaTitle"
                                    {...register("metaTitle")}
                                    placeholder="Page title for search engines"
                                />
                                <p className="text-xs text-gray-500">
                                    If empty, page title will be used.
                                </p>
                            </div>

                            {/* Meta Description */}
                            <div className="space-y-2">
                                <Label htmlFor="metaDescription">Meta Description</Label>
                                <Textarea
                                    id="metaDescription"
                                    {...register("metaDescription")}
                                    placeholder="Page description for search engines"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-500">
                                    If empty, excerpt or first 160 characters of content will be used.
                                </p>
                            </div>

                            {/* Featured Image */}
                            <div className="space-y-2">
                                <Label htmlFor="featuredImage">Featured Image URL</Label>
                                <Input
                                    id="featuredImage"
                                    {...register("featuredImage")}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="sections" className="space-y-4">
                            {/* Add Section Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" onClick={() => addSection('hero')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Hero Section
                                </Button>
                                <Button type="button" variant="outline" onClick={() => addSection('content')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Content Section
                                </Button>
                                <Button type="button" variant="outline" onClick={() => addSection('features')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Features
                                </Button>
                                <Button type="button" variant="outline" onClick={() => addSection('stats')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Statistics
                                </Button>
                            </div>

                            {/* Sections List */}
                            {sections.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                    <p>No sections added yet.</p>
                                    <p className="text-sm">Add sections to build your page layout.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sections.map((section, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{section.type}</Badge>
                                                    <span className="text-sm text-gray-500">Section {index + 1}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => moveSection(index, -1)}
                                                        disabled={index === 0}
                                                    >
                                                        <ArrowUpDown className="w-4 h-4 rotate-90" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => moveSection(index, 1)}
                                                        disabled={index === sections.length - 1}
                                                    >
                                                        <ArrowUpDown className="w-4 h-4 -rotate-90" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeSection(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <Input
                                                    placeholder="Section Title"
                                                    value={section.title || ""}
                                                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Subtitle (optional)"
                                                    value={section.subtitle || ""}
                                                    onChange={(e) => updateSection(index, 'subtitle', e.target.value)}
                                                />
                                                <Textarea
                                                    placeholder="Section content..."
                                                    value={section.content || ""}
                                                    onChange={(e) => updateSection(index, 'content', e.target.value)}
                                                    rows={3}
                                                />
                                                <Input
                                                    placeholder="Image URL (optional)"
                                                    value={section.image || ""}
                                                    onChange={(e) => updateSection(index, 'image', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : initialData ? "Update Page" : "Create Page"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}