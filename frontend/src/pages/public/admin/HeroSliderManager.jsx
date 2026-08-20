// components/admin/HeroSliderManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useDeleteHeroSliderMutation,
    useGetHeroSlidersQuery,
    useReorderHeroSlidersMutation,
    useUpdateHeroSliderMutation,
    useUploadHeroSliderMutation,
} from "@/features/apis/heroSliderApi";
import { useAppSelector } from "@/features/store";
import { backend_url } from "@/utils/server";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
    Edit,
    Eye,
    EyeOff,
    Image,
    Loader2,
    MoveDown,
    MoveUp,
    Plus,
    Trash2
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import DeleteDialog from "./components/DeleteDialog";
import HeroSliderEditDialog from "./components/HeroSliderEditDialog";
import HeroSliderUploadDialog from "./components/HeroSliderUploadDialog";
import SortableTableRow from "@/components/common/SortableTableRow";

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
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        tableHeader: isDarkMode ? "bg-gray-800" : "bg-gray-50",
        tableRow: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            danger: isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" : "bg-red-500 text-white hover:bg-red-600",
            ghost: isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
        },
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

// Slide Row Component
// In HeroSliderManager.jsx - Updated SlideRow

const SlideRow = ({ item, index, totalItems, onEdit, onDelete, onToggleActive, onMoveUp, onMoveDown }) => {
    const theme = useTheme();

    return (
        <SortableTableRow id={item._id} className={theme.tableRow}>
            {/* Column 1: Slide (image + title) */}
            <TableCell className="py-2">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                            src={`${backend_url}${item.imageUrl}`}
                            alt={item.title || "Slide"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = "https://placehold.co/56x40/e2e8f0/64748b?text=No+Image";
                            }}
                        />
                    </div>
                    <div>
                        <div className={`font-medium text-sm ${theme.text}`}>
                            {item.title || "Untitled Slide"}
                        </div>
                        <div className={`text-xs ${theme.textMuted}`}>
                            {item.imageUrl.split('/').pop()}
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Column 2: Subtitle */}
            <TableCell className={`py-2 ${theme.textMuted}`}>
                {item.subtitle ? (
                    <span className="line-clamp-2 text-sm">{item.subtitle}</span>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )}
            </TableCell>

            {/* Column 3: Status */}
            <TableCell className="py-2">
                <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-emerald-500/20 text-emerald-400" : ""}>
                    {item.isActive ? "Active" : "Inactive"}
                </Badge>
            </TableCell>

            {/* Column 4: Actions */}
            <TableCell className="py-2 text-right">
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveUp(index)}
                        disabled={index === 0}
                        className={`h-7 w-7 p-0 ${theme.button.ghost}`}
                        title="Move Up"
                    >
                        <MoveUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveDown(index)}
                        disabled={index === totalItems - 1}
                        className={`h-7 w-7 p-0 ${theme.button.ghost}`}
                        title="Move Down"
                    >
                        <MoveDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(item)}
                        className={`h-7 w-7 p-0 ${theme.button.ghost}`}
                        title={item.isActive ? "Deactivate" : "Activate"}
                    >
                        {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className={`h-7 w-7 p-0 ${theme.button.ghost}`}
                        title="Edit"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        className={`h-7 w-7 p-0 ${theme.button.danger}`}
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </TableCell>
        </SortableTableRow>
    );
};

export default function HeroSliderManager() {
    const theme = useTheme();
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSlide, setSelectedSlide] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { data, isLoading, refetch } = useGetHeroSlidersQuery();
    const [uploadHeroSlider, { isLoading: isUploading }] = useUploadHeroSliderMutation();
    const [updateHeroSlider, { isLoading: isUpdating }] = useUpdateHeroSliderMutation();
    const [deleteHeroSlider, { isLoading: isDeleting }] = useDeleteHeroSliderMutation();
    const [reorderHeroSliders, { isLoading: isReordering }] = useReorderHeroSlidersMutation();

    const slides = data?.data || [];

    // Form state for upload
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        link: "",
        linkText: "",
        imageFile: null,
        imagePreview: null,
        order: 0,
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = slides.findIndex((item) => item._id === active.id);
            const newIndex = slides.findIndex((item) => item._id === over.id);
            const newOrder = arrayMove(slides, oldIndex, newIndex);

            try {
                const reorderData = newOrder.map((item, index) => ({
                    id: item._id,
                    order: index,
                }));
                await reorderHeroSliders(reorderData).unwrap();
                toast.success("Slides reordered successfully");
                refetch();
            } catch (error) {
                toast.error("Failed to reorder slides");
                refetch();
            }
        }
    };

    // const handleUpload = async () => {
    //     if (!formData.imageFile) {
    //         toast.error("Please select an image");
    //         return;
    //     }

    //     try {
    //         const formDataToSend = new FormData();
    //         // FIX: Use 'image' field name to match multer's uploadSingleImage
    //         formDataToSend.append("image", formData.imageFile);
    //         formDataToSend.append("title", formData.title || "");
    //         formDataToSend.append("subtitle", formData.subtitle || "");
    //         formDataToSend.append("link", formData.link || "");
    //         formDataToSend.append("linkText", formData.linkText || "");
    //         formDataToSend.append("order", String(slides.length));

    //         console.log("hero upload formdata:", formDataToSend)
    //         await uploadHeroSlider(formDataToSend).unwrap();
    //         toast.success("Slide uploaded successfully");

    //         setFormData({
    //             title: "",
    //             subtitle: "",
    //             link: "",
    //             linkText: "",
    //             imageFile: null,
    //             imagePreview: null,
    //             order: 0,
    //         });
    //         setUploadProgress(0);
    //         setIsUploadDialogOpen(false);
    //         refetch();
    //     } catch (error) {
    //         console.log("upload error:", error);
    //         toast.error(error?.data?.message || "Failed to upload slide");
    //     }
    // };

    const handleUpload = async () => {
        // Debug: log the file object
        console.log("Upload - formData.imageFile:", formData.imageFile);

        if (!formData.imageFile) {
            toast.error("Please select an image");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("hero", formData.imageFile);
            formDataToSend.append("title", formData.title || "");
            formDataToSend.append("subtitle", formData.subtitle || "");
            formDataToSend.append("link", formData.link || "");
            formDataToSend.append("linkText", formData.linkText || "");
            formDataToSend.append("order", String(slides.length));

            // Debug: log all FormData entries
            console.log("=== FormData Contents ===");
            for (let pair of formDataToSend.entries()) {
                console.log(pair[0], pair[1]);
            }

            const result = await uploadHeroSlider(formDataToSend).unwrap();
            console.log("Upload successful:", result);
            toast.success("Slide uploaded successfully");

            setFormData({
                title: "",
                subtitle: "",
                link: "",
                linkText: "",
                imageFile: null,
                imagePreview: null,
                order: 0,
            });
            setUploadProgress(0);
            setIsUploadDialogOpen(false);
            refetch();
        } catch (error) {
            console.error("Upload error:", error);
            // Log full error response
            console.error("Error response:", error?.data);
            toast.error(error?.data?.message || "Failed to upload slide");
        }
    };

    const handleUpdate = async () => {
        if (!selectedSlide) return;

        try {
            await updateHeroSlider({
                id: selectedSlide._id,
                title: formData.title,
                subtitle: formData.subtitle,
                link: formData.link,
                linkText: formData.linkText,
                isActive: formData.isActive !== undefined ? formData.isActive : selectedSlide.isActive,
            }).unwrap();
            toast.success("Slide updated successfully");
            setIsEditDialogOpen(false);
            setSelectedSlide(null);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update slide");
        }
    };

    const handleDelete = async () => {
        if (!selectedSlide) return;

        try {
            await deleteHeroSlider(selectedSlide._id).unwrap();
            toast.success("Slide deleted successfully");
            setIsDeleteDialogOpen(false);
            setSelectedSlide(null);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to delete slide");
        }
    };

    const handleToggleActive = async (slide) => {
        try {
            await updateHeroSlider({
                id: slide._id,
                isActive: !slide.isActive,
            }).unwrap();
            toast.success(`Slide ${slide.isActive ? 'deactivated' : 'activated'} successfully`);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update slide status");
        }
    };

    const handleEdit = (slide) => {
        setSelectedSlide(slide);
        setFormData({
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            link: slide.link || "",
            linkText: slide.linkText || "",
            imageFile: null,
            imagePreview: null,
            isActive: slide.isActive,
            order: slide.order || 0,
        });
        setIsEditDialogOpen(true);
    };

    const handleMoveUp = async (index) => {
        if (index === 0) return;
        const newOrder = arrayMove(slides, index, index - 1);
        const reorderData = newOrder.map((item, idx) => ({
            id: item._id,
            order: idx,
        }));
        try {
            await reorderHeroSliders(reorderData).unwrap();
            refetch();
        } catch (error) {
            toast.error("Failed to reorder slides");
        }
    };

    const handleMoveDown = async (index) => {
        if (index === slides.length - 1) return;
        const newOrder = arrayMove(slides, index, index + 1);
        const reorderData = newOrder.map((item, idx) => ({
            id: item._id,
            order: idx,
        }));
        try {
            await reorderHeroSliders(reorderData).unwrap();
            refetch();
        } catch (error) {
            toast.error("Failed to reorder slides");
        }
    };

    if (isLoading) {
        return (
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-12 text-center">
                    <Loader2 className={`w-8 h-8 animate-spin ${theme.icon} mx-auto mb-4`} />
                    <p className={theme.textMuted}>Loading slides...</p>
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
                            <CardTitle className={`text-2xl ${theme.text}`}>Hero Slider Management</CardTitle>
                            <CardDescription className={theme.textMuted}>
                                Manage the hero slider images displayed on the homepage
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsUploadDialogOpen(true)}
                            className={`flex items-center gap-2 ${theme.button.primary}`}
                        >
                            <Plus className="w-4 h-4" />
                            Add Slide
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.border}`}>
                                <Image className={`w-5 h-5 ${theme.icon}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>{slides.length}</p>
                                <p className={`text-sm ${theme.textMuted}`}>Total Slides</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.border}`}>
                                <Eye className={`w-5 h-5 ${theme.icon}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>
                                    {slides.filter(s => s.isActive).length}
                                </p>
                                <p className={`text-sm ${theme.textMuted}`}>Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.border}`}>
                                <EyeOff className={`w-5 h-5 ${theme.icon}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>
                                    {slides.filter(s => !s.isActive).length}
                                </p>
                                <p className={`text-sm ${theme.textMuted}`}>Inactive</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg border ${theme.border}`}>
                                <span className="text-lg">📸</span>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme.text}`}>
                                    {new Set(slides.map(s => s.uploadedBy?._id)).size}
                                </p>
                                <p className={`text-sm ${theme.textMuted}`}>Uploaders</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Slides Table */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <Table>
                                <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                    <TableRow>
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead className={`${theme.textSecondary} text-left`}>Slide</TableHead>
                                        <TableHead className={`${theme.textSecondary} text-left`}>Subtitle</TableHead>
                                        <TableHead className={`${theme.textSecondary} text-left`}>Status</TableHead>
                                        <TableHead className={`text-right ${theme.textSecondary}`}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {slides.length === 0 ? (
                                        <TableRow className={theme.tableRow}>
                                            <TableCell colSpan={5} className={`text-center py-12 ${theme.textMuted}`}>
                                                <Image className={`w-12 h-12 mx-auto mb-4 ${theme.icon}`} />
                                                <p>No slides found</p>
                                                <p className="text-sm mt-1">Upload your first hero slide</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <SortableContext
                                            items={slides.map(item => item._id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {slides.map((slide, index) => (
                                                <SlideRow
                                                    key={slide._id}
                                                    item={slide}
                                                    index={index}
                                                    totalItems={slides.length}
                                                    onEdit={handleEdit}
                                                    onDelete={(item) => {
                                                        setSelectedSlide(item);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    onToggleActive={handleToggleActive}
                                                    onMoveUp={handleMoveUp}
                                                    onMoveDown={handleMoveDown}
                                                />
                                            ))}
                                        </SortableContext>
                                    )}
                                </TableBody>
                            </Table>
                        </DndContext>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <HeroSliderUploadDialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                formData={formData}
                setFormData={setFormData}
                onUpload={handleUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
            />

            {/* Edit Dialog */}
            <HeroSliderEditDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                formData={formData}
                setFormData={setFormData}
                handleUpdate={handleUpdate}
                selectedSlide={selectedSlide}
                isUpdating={isUpdating}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                selectedSlide={selectedSlide}
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                isDeleting={isDeleting}
                handleDelete={handleDelete}
            />
        </div>
    );
}