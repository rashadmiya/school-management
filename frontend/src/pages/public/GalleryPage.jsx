
// Mock data - will be replaced with API data
const GALLERY_DATA = {
    categories: [
        { id: "all", name: "All", icon: Image, count: 0 },
        { id: "achievements", name: "Achievements", icon: Trophy },
        { id: "campus", name: "Campus", icon: Camera },
        { id: "students", name: "Brightest Students", icon: Users },
        { id: "innovation", name: "Innovations", icon: Sparkles },
        { id: "events", name: "Events", icon: Calendar },
    ],
    images: [
        // Sample images - will come from API
        {
            id: 1,
            title: "Science Fair 2024",
            category: "events",
            imageUrl: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800",
            description: "Students showcasing their innovative projects",
            date: "2024-01-15"
        },
        {
            id: 2,
            title: "Campus Aerial View",
            category: "campus",
            imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=800",
            description: "Beautiful view of our main campus",
            date: "2024-01-10"
        },
        {
            id: 3,
            title: "Top Achievers 2024",
            category: "achievements",
            imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=800",
            description: "Our star students of the year",
            date: "2024-01-05"
        },
        {
            id: 4,
            title: "Robotics Workshop",
            category: "innovation",
            imageUrl: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800",
            description: "Students learning robotics and AI",
            date: "2024-01-02"
        },
        {
            id: 5,
            title: "Cultural Festival",
            category: "events",
            imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
            description: "Annual cultural celebration",
            date: "2023-12-20"
        },
        {
            id: 6,
            title: "Library Corner",
            category: "campus",
            imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800",
            description: "Quiet reading space",
            date: "2023-12-15"
        },
    ]
};

// pages/public/GalleryPage.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    useGetPublicGalleryCategoriesQuery,
    useGetPublicGalleryImagesQuery
} from "@/features/apis/publicApi";
import { backend_url } from "@/utils/server";

import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Download,
    Heart,
    Image,
    Loader2,
    Share2,
    Sparkles,
    Trophy,
    Users,
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

// Icon mapping for categories
const CATEGORY_ICONS = {
    achievements: Trophy,
    campus: Camera,
    students: Users,
    innovation: Sparkles,
    events: Calendar,
    sports: Trophy,
    academic: Image,
    cultural: Sparkles,
    others: Image,
};

const CATEGORY_LABELS = {
    achievements: "Achievements",
    campus: "Campus",
    students: "Brightest Students",
    innovation: "Innovations",
    events: "Events",
    sports: "Sports",
    academic: "Academic",
    cultural: "Cultural",
    others: "Others",
};

export default function GalleryPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Fetch categories from API
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
        error: categoriesError
    } = useGetPublicGalleryCategoriesQuery();

    // Fetch images from API
    const {
        data: imagesData,
        isLoading: imagesLoading,
        isFetching,
        error: imagesError
    } = useGetPublicGalleryImagesQuery({
        page: currentPage,
        limit: itemsPerPage,
        category: selectedCategory === "all" ? "" : selectedCategory,
    });

    // Handle errors
    useEffect(() => {
        if (categoriesError) {
            toast.error("Failed to load categories");
        }
        if (imagesError) {
            toast.error("Failed to load gallery images");
        }
    }, [categoriesError, imagesError]);

    // Get categories with "All" option
    const categories = React.useMemo(() => {
        const allCategory = { id: "all", name: "All", icon: Image, count: 0 };
        if (!categoriesData?.data) return [allCategory];

        const apiCategories = categoriesData.data.map(cat => ({
            id: cat.name,
            name: CATEGORY_LABELS[cat.name] || cat.name,
            icon: CATEGORY_ICONS[cat.name] || Image,
            count: cat.count || 0,
        }));

        const totalCount = apiCategories.reduce((sum, cat) => sum + cat.count, 0);
        allCategory.count = totalCount;

        return [allCategory, ...apiCategories];
    }, [categoriesData]);

    // Get images data
    const images = imagesData?.data || [];
    const pagination = imagesData?.pagination || {
        total: 0,
        page: 1,
        pages: 1,
        limit: itemsPerPage,
    };
    const totalPages = pagination.pages || 1;

    // Get category info
    const getCategoryIcon = (categoryId) => {
        return CATEGORY_ICONS[categoryId] || Image;
    };

    const getCategoryName = (categoryId) => {
        return CATEGORY_LABELS[categoryId] || categoryId;
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setIsLightboxOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setSelectedImage(null);
        document.body.style.overflow = 'unset';
    };

    const handleNext = () => {
        const currentIndex = images.findIndex(img => img._id === selectedImage?._id);
        const nextIndex = (currentIndex + 1) % images.length;
        setSelectedImage(images[nextIndex]);
    };

    const handlePrev = () => {
        const currentIndex = images.findIndex(img => img._id === selectedImage?._id);
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setSelectedImage(images[prevIndex]);
    };

    const handleDownload = async (image) => {
        try {
            const response = await fetch(image.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = image.title || 'gallery-image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Image downloaded successfully");
        } catch (error) {
            toast.error("Failed to download image");
        }
    };

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isLightboxOpen) {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, selectedImage, images]);

    const isLoading = imagesLoading || categoriesLoading;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Gallery</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Explore moments that define our school's journey of excellence and innovation
                </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;

                    return (
                        <Button
                            key={category.id}
                            variant={isActive ? "default" : "outline"}
                            onClick={() => {
                                setSelectedCategory(category.id);
                                setCurrentPage(1);
                            }}
                            className={`flex items-center gap-2 ${isActive
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                            disabled={isLoading}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{category.name}</span>
                            <Badge
                                variant="secondary"
                                className={`ml-1 ${isActive ? "bg-white/20 text-white" : "bg-gray-100"
                                    }`}
                            >
                                {category.count}
                            </Badge>
                        </Button>
                    );
                })}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading gallery...</span>
                </div>
            )}

            {/* Image Grid */}
            {!isLoading && images.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                            {selectedCategory !== "all"
                                ? `No images found in "${getCategoryName(selectedCategory)}" category`
                                : "No images found in the gallery"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            Check back later for new uploads
                        </p>
                    </CardContent>
                </Card>
            ) : (
                !isLoading && (
                    <>
                        {/* Results count */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-500">
                                Showing {images.length} of {pagination.total} images
                            </p>
                            {selectedCategory !== "all" && (
                                <Badge variant="outline" className="text-xs">
                                    {getCategoryName(selectedCategory)}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {images.map((image, index) => (
                                <motion.div
                                    key={image._id || image.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group cursor-pointer"
                                    onClick={() => handleImageClick(image)}
                                >
                                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                                            <img
                                                src={`${backend_url}${image.imageUrl}`}
                                                alt={image.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                                <div className="p-4 w-full">
                                                    <h3 className="text-white font-semibold text-lg line-clamp-1">
                                                        {image.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(image.createdAt || image.date).toLocaleDateString()}
                                                        </span>
                                                        {image.category && (
                                                            <Badge className="bg-white/20 text-white border-0">
                                                                {getCategoryName(image.category)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {image.title}
                                                    </h3>
                                                    {image.description && (
                                                        <p className="text-sm text-gray-500 truncate">
                                                            {image.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400 ml-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Handle like
                                                        }}
                                                    >
                                                        <Heart className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Handle share
                                                        }}
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-10">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isFetching}
                                    className="h-9 w-9 p-0"
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
                                            className={`h-9 w-9 p-0 ${currentPage === pageNum
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "hover:bg-gray-50"
                                                }`}
                                            disabled={isFetching}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                {totalPages > 7 && currentPage < totalPages - 3 && (
                                    <>
                                        <span className="text-gray-400">...</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="h-9 w-9 p-0 hover:bg-gray-50"
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
                                    className="h-9 w-9 p-0"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {isLightboxOpen && selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        <div
                            className="relative max-w-6xl w-full mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={closeLightbox}
                                className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Image */}
                            <img
                                src={`${backend_url}${selectedImage.imageUrl}`}
                                alt={selectedImage.title}
                                className="w-full max-h-[80vh] object-contain rounded-lg"
                            />
                            
                            {/* Image Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">{selectedImage.title}</h3>
                                        {selectedImage.description && (
                                            <p className="text-gray-300 mt-1">{selectedImage.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(selectedImage.createdAt || selectedImage.date).toLocaleDateString()}
                                            </span>
                                            {selectedImage.category && (
                                                <Badge className="bg-white/20 text-white border-0">
                                                    {getCategoryName(selectedImage.category)}
                                                </Badge>
                                            )}
                                            {/* {selectedImage?.views !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-4 h-4" />
                                                    {selectedImage?.views} views
                                                </span>
                                            )} */}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="text-gray-800 border-gray-100 hover:bg-gray-200"
                                        onClick={() => handleDownload(selectedImage)}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 hover:bg-black/70"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 hover:bg-black/70"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>

                                    {/* Image Counter */}
                                    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
                                        {images.findIndex(img => img._id === selectedImage._id) + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}