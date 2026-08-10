// components/admin/gallery/GalleryManager.jsx
import UploadGalleryImageForm from "@/components/admin/UploadGalleryImageForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useDeleteGalleryImageMutation,
    useGetGalleryImagesQuery,
    useTogglePublishGalleryImageMutation
} from "@/features/apis/galleryApi";
import { useAppSelector } from "@/features/store";
import { backend_url } from "@/utils/server";
import {
    Award,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    EyeOff,
    FolderOpen,
    Grid,
    Image as ImageIcon,
    List,
    Loader2,
    Plus,
    Search,
    Trash2,
    Upload
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

// Category configuration
const CATEGORIES = [
    { id: "achievements", name: "Achievements", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400" },
    { id: "campus", name: "Campus", color: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400" },
    { id: "students", name: "Brightest Students", color: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" },
    { id: "innovation", name: "Innovations", color: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400" },
    { id: "events", name: "Events", color: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-400" },
    { id: "sports", name: "Sports", color: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400" },
    { id: "academic", name: "Academic", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400" },
    { id: "cultural", name: "Cultural", color: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400" },
    { id: "others", name: "Others", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
];

export default function GalleryManager() {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const [selectedImage, setSelectedImage] = useState(null);
    const [viewMode, setViewMode] = useState("grid");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const itemsPerPage = 12;

    // API Queries
    const { data: imagesData, isLoading, isFetching, refetch } = useGetGalleryImagesQuery({
        page: currentPage,
        limit: itemsPerPage,
        category: selectedCategory === "all" ? "" : selectedCategory,
        search: searchTerm || undefined,
    });

    // API Mutations
    const [deleteGalleryImage, { isLoading: isDeleting }] = useDeleteGalleryImageMutation();
    const [togglePublish, { isLoading: isToggling }] = useTogglePublishGalleryImageMutation();

    // Get images and pagination from API response
    const images = imagesData?.data || [];
    const pagination = imagesData?.pagination || {
        total: 0,
        page: 1,
        pages: 1,
        limit: itemsPerPage,
    };
    const totalPages = pagination.pages || 1;

    // Get categories with counts
    const categoriesWithCounts = React.useMemo(() => {
        const categoryCounts = {};
        images.forEach(img => {
            categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1;
        });
        return CATEGORIES.map(cat => ({
            ...cat,
            count: categoryCounts[cat.id] || 0,
        }));
    }, [images]);

    const handleDelete = async () => {
        if (!selectedImage) return;

        try {
            await deleteGalleryImage(selectedImage._id).unwrap();
            toast.success("Image deleted successfully");
            setIsDeleteDialogOpen(false);
            setSelectedImage(null);
            refetch();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error?.data?.message || "Failed to delete image");
        }
    };

    const handleTogglePublish = async (image) => {
        try {
            await togglePublish(image._id).unwrap();
            toast.success(`Image ${image.isPublished ? 'unpublished' : 'published'} successfully`);
            refetch();
        } catch (error) {
            console.error("Toggle publish error:", error);
            toast.error(error?.data?.message || "Failed to update publish status");
        }
    };

    const getCategoryColor = (categoryId) => {
        const cat = CATEGORIES.find(c => c.id === categoryId);
        return cat?.color || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    };

    const getCategoryName = (categoryId) => {
        const cat = CATEGORIES.find(c => c.id === categoryId);
        return cat?.name || categoryId;
    };

    // Theme-based classes
    const theme = {
        textPrimary: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        inputBorder: isDarkMode ? "border-gray-700" : "border-gray-300",
        select: isDarkMode
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-300 text-gray-900",
        selectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
        selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        stat: {
            blue: isDarkMode
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-blue-50 text-blue-600",
            purple: isDarkMode
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                : "bg-purple-50 text-purple-600",
            green: isDarkMode
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-green-50 text-green-600",
            orange: isDarkMode
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                : "bg-orange-50 text-orange-600",
        },
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white",
        input: isDarkMode
            ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            : "bg-white border-gray-300 text-gray-900",
        label: isDarkMode ? "text-gray-300" : "text-gray-700",
        cardIcon: {
            blue: isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
            purple: isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600",
            green: isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-green-100 text-green-600",
            orange: isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600",
        },
        table: {
            header: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200",
            row: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
            cell: isDarkMode ? "text-gray-300" : "text-gray-700",
        },
        button: {
            primary: isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50",
            ghost: isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            destructive: isDarkMode
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-red-500 text-white hover:bg-red-600",
        },
        badge: {
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
        },
    };

    // Calculate stats
    const totalImages = images.length;
    const totalCategories = CATEGORIES.length;
    const uploadedThisMonth = images.filter(img => {
        const imgDate = new Date(img.createdAt || img.date);
        const now = new Date();
        return imgDate.getMonth() === now.getMonth() && imgDate.getFullYear() === now.getFullYear();
    }).length;

    const categoryCounts = {};
    images.forEach(img => {
        categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1;
    });
    const mostUsedCategory = Object.keys(categoryCounts).reduce((a, b) =>
        categoryCounts[a] > categoryCounts[b] ? a : b
        , '');

    return (
        <div className={`space-y-6 ${isDarkMode ? "text-white" : ""}`}>
            {/* Header */}
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className={`text-2xl flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                <ImageIcon className="w-6 h-6" />
                                Gallery Management
                            </CardTitle>
                            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                                Manage school gallery images, categories, and descriptions
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsUploadDialogOpen(true)}
                            className={`flex items-center gap-2 ${theme.button.primary}`}
                        >
                            <Plus className="w-4 h-4" />
                            Upload Image
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Total Images</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {totalImages}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.cardIcon.blue}`}>
                                <ImageIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Categories</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {totalCategories}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.cardIcon.purple}`}>
                                <FolderOpen className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Uploaded This Month</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {uploadedThisMonth}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.cardIcon.green}`}>
                                <Upload className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Most Used Category</p>
                                <p className={`text-lg font-bold truncate max-w-[100px] ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {getCategoryName(mostUsedCategory) || 'N/A'}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.cardIcon.orange}`}>
                                <Award className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-gray-500" : "text-gray-400"} w-4 h-4`} />
                            <Input
                                placeholder="Search images..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className={`pl-10 ${theme.input}`}
                            />
                        </div>
                        <Select value={selectedCategory} onValueChange={(value) => {
                            setSelectedCategory(value);
                            setCurrentPage(1);
                        }}>
                            <SelectTrigger className={`w-48 ${theme.select}`}>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All Categories</SelectItem>
                                {categoriesWithCounts.map(category => (
                                    <SelectItem key={category.id} value={category.id} className={theme.selectItem}>
                                        {category.name} ({category.count})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-1 border rounded-md p-0.5">
                            <Button
                                variant={viewMode === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className={`h-8 w-8 p-0 ${viewMode === "grid" ? theme.button.primary : theme.button.ghost}`}
                            >
                                <Grid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className={`h-8 w-8 p-0 ${viewMode === "list" ? theme.button.primary : theme.button.ghost}`}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className={`ml-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Loading gallery...
                    </span>
                </div>
            )}

            {/* Images Grid/List */}
            {!isLoading && images.length === 0 ? (
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-12 text-center">
                        <ImageIcon className={`w-16 h-16 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
                        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                            No images found
                        </p>
                        <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"} mt-1`}>
                            Upload your first image to get started
                        </p>
                        <Button
                            onClick={() => setIsUploadDialogOpen(true)}
                            className={`mt-4 ${theme.button.primary}`}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Image
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                !isLoading && (
                    <>
                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {images.map((image) => (
                                    <Card key={image._id} className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} overflow-hidden group hover:shadow-lg transition-shadow`}>
                                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                                            <img
                                               src={`${backend_url}${image.imageUrl}`}
                                                alt={image.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-white border-white hover:bg-white/20"
                                                    onClick={() => {
                                                        setSelectedImage(image);
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`border-${image.isPublished ? 'green' : 'yellow'}-400 hover:bg-${image.isPublished ? 'green' : 'yellow'}-500/20`}
                                                    onClick={() => handleTogglePublish(image)}
                                                    disabled={isToggling}
                                                >
                                                    {image.isPublished ?
                                                        <Eye className="w-4 h-4" /> :
                                                        <EyeOff className="w-4 h-4" />
                                                    }
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-400 border-red-400 hover:bg-red-500/20"
                                                    onClick={() => {
                                                        setSelectedImage(image);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {!image.isPublished && (
                                                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                                    Draft
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h4 className={`font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                {image.title}
                                            </h4>
                                            <div className="flex items-center justify-between mt-2">
                                                <Badge className={getCategoryColor(image.category)}>
                                                    {getCategoryName(image.category)}
                                                </Badge>
                                                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    {new Date(image.createdAt || image.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className={theme.table.header}>
                                                <tr>
                                                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Image</th>
                                                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Title</th>
                                                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Category</th>
                                                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Status</th>
                                                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Date</th>
                                                    <th className={`text-right p-4 text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${isDarkMode ? "divide-gray-800" : "divide-gray-200"}`}>
                                                {images.map((image) => (
                                                    <tr key={image._id} className={theme.table.row}>
                                                        <td className="p-4">
                                                            <img
                                                                src={`${backend_url}${image.imageUrl}`}
                                                                alt={image.title}
                                                                className="w-16 h-16 object-cover rounded"
                                                            />
                                                        </td>
                                                        <td className={`p-4 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                            {image.title}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={getCategoryColor(image.category)}>
                                                                {getCategoryName(image.category)}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge
                                                                variant={image.isPublished ? "default" : "secondary"}
                                                                className={image.isPublished ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}
                                                            >
                                                                {image.isPublished ? "Published" : "Draft"}
                                                            </Badge>
                                                        </td>
                                                        <td className={`p-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                                            {new Date(image.createdAt || image.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`h-8 w-8 p-0 ${theme.button.ghost}`}
                                                                    onClick={() => {
                                                                        setSelectedImage(image);
                                                                        setIsEditDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`h-8 w-8 p-0 ${image.isPublished ? "text-emerald-400" : "text-yellow-400"}`}
                                                                    onClick={() => handleTogglePublish(image)}
                                                                    disabled={isToggling}
                                                                >
                                                                    {image.isPublished ?
                                                                        <Eye className="w-4 h-4" /> :
                                                                        <EyeOff className="w-4 h-4" />
                                                                    }
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                    onClick={() => {
                                                                        setSelectedImage(image);
                                                                        setIsDeleteDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} images
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1 || isFetching}
                                        className={`h-8 w-8 p-0 ${theme.button.outline}`}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 7) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 4) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 3) {
                                            pageNum = totalPages - 6 + i;
                                        } else {
                                            pageNum = currentPage - 3 + i;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`h-8 w-8 p-0 ${currentPage === pageNum ? theme.button.primary : theme.button.outline}`}
                                                disabled={isFetching}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {totalPages > 7 && currentPage < totalPages - 3 && (
                                        <>
                                            <span className={isDarkMode ? "text-gray-400" : "text-gray-400"}>...</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(totalPages)}
                                                className={`h-8 w-8 p-0 ${theme.button.outline}`}
                                                disabled={isFetching}
                                            >
                                                {totalPages}
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || isFetching}
                                        className={`h-8 w-8 p-0 ${theme.button.outline}`}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )
            )}

            {/* Upload Dialog */}
            <UploadGalleryImageForm
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                onSuccess={refetch}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className={theme.dialog}>
                    <DialogHeader>
                        <DialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                            Delete Image
                        </DialogTitle>
                    </DialogHeader>
                    <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        Are you sure you want to delete "{selectedImage?.title}"? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className={theme.button.outline}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={theme.button.destructive}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog - Coming soon */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className={theme.dialog}>
                    <DialogHeader>
                        <DialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                            Edit Image
                        </DialogTitle>
                    </DialogHeader>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                        Edit functionality coming soon...
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            className={theme.button.outline}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}