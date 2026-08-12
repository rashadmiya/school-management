// components/admin/gallery/UploadGalleryImageForm.jsx
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUploadGalleryImageMutation } from "@/features/apis/galleryApi";
import { useAppSelector } from "@/features/store";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

const CATEGORIES = [
    { id: "achievements", name: "Achievements" },
    { id: "campus", name: "Campus" },
    { id: "students", name: "Brightest Students" },
    { id: "innovation", name: "Innovations" },
    { id: "events", name: "Events" },
    { id: "sports", name: "Sports" },
    { id: "academic", name: "Academic" },
    { id: "cultural", name: "Cultural" },
    { id: "others", name: "Others" },
];

export default function UploadGalleryImageForm({ open, onOpenChange, onSuccess }) {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        imageFile: null,
        imagePreview: null,
        isPublished: true,
    });

    const [uploadGalleryImage, { isLoading: isUploading }] = useUploadGalleryImageMutation();

    // Theme-based classes
    const theme = {
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white",
        input: isDarkMode
            ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            : "bg-white border-gray-300 text-gray-900",
        label: isDarkMode ? "text-gray-300" : "text-gray-700",
        select: isDarkMode
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-white border-gray-300 text-gray-900",
        selectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
        selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        button: {
            outline: isDarkMode
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50",
            primary: isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white",
        },
    };

    // const handleFileSelect = (e) => {
    //     const file = e.target.files[0];
    //     if (file) {
    //         // Validate file type
    //         const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    //         if (!allowedTypes.includes(file.type)) {
    //             toast.error("Please upload a valid image (JPEG, PNG, WebP)");
    //             return;
    //         }

    //         // Validate file size (max 5MB)
    //         if (file.size > 5 * 1024 * 1024) {
    //             toast.error("Image size should be less than 5MB");
    //             return;
    //         }

    //         const reader = new FileReader();
    //         reader.onload = (e) => {
    //             setFormData(prev => ({
    //                 ...prev,
    //                 imageFile: file,
    //                 imagePreview: e.target.result,
    //             }));
    //         };
    //         reader.readAsDataURL(file);
    //     }
    // };

    // const handleUpload = async () => {
    //     if (!formData.title || !formData.category || !formData.imageFile) {
    //         toast.error("Please fill all required fields");
    //         return;
    //     }

    //     try {
    //         const formDataToSend = new FormData();
    //         formDataToSend.append("image", formData.imageFile);
    //         formDataToSend.append("title", formData.title);
    //         formDataToSend.append("description", formData.description || "");
    //         formDataToSend.append("category", formData.category);
    //         formDataToSend.append("isPublished", String(formData.isPublished));

    //         // Log for debugging
    //         console.log("Sending FormData:");
    //         for (let pair of formDataToSend.entries()) {
    //             console.log(pair[0], pair[1]);
    //         }

    //         const result = await uploadGalleryImage(formDataToSend).unwrap();
    //         console.log("Upload successful:", result);

    //         toast.success("Image uploaded successfully!");
    //         onOpenChange(false);
    //         if (onSuccess) onSuccess();

    //     } catch (error) {
    //         console.error("Upload error:", error);
    //         console.error("Error response:", error?.data);
    //         toast.error(error?.data?.message || "Failed to upload image");
    //     }
    // };
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Sanitize file name - remove URL encoding
            const sanitizedName = decodeURIComponent(file.name);
            const sanitizedFile = new File([file], sanitizedName, { type: file.type });

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(sanitizedFile.type)) {
                toast.error("Please upload a valid image (JPEG, PNG, WebP)");
                return;
            }

            // Validate file size (max 5MB)
            if (sanitizedFile.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    imageFile: sanitizedFile,
                    imagePreview: e.target.result,
                }));
            };
            reader.readAsDataURL(sanitizedFile);
        }
    };

    const handleUpload = async () => {
        if (!formData.title || !formData.category || !formData.imageFile) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("image", formData.imageFile);
            formDataToSend.append("title", formData.title.trim());
            formDataToSend.append("description", formData.description?.trim() || "");
            formDataToSend.append("category", formData.category);
            formDataToSend.append("isPublished", String(formData.isPublished));

            // Debug: Log FormData entries
            console.log("=== FormData being sent ===");
            for (let pair of formDataToSend.entries()) {
                if (pair[0] === 'image') {
                    console.log(pair[0], pair[1].name, pair[1].size, pair[1].type);
                } else {
                    console.log(pair[0], pair[1]);
                }
            }

            const result = await uploadGalleryImage(formDataToSend).unwrap();

            console.log("Upload successful:", result);
            toast.success("Image uploaded successfully!");

            // Reset form
            setFormData({
                title: "",
                description: "",
                category: "",
                imageFile: null,
                imagePreview: null,
                isPublished: true,
            });
            setUploadProgress(0);
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Upload error:", error);
            console.error("Error response:", error?.data);
            toast.error(error?.data?.message || error?.message || "Failed to upload image");
        }
    };

    
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            category: "",
            imageFile: null,
            imagePreview: null,
            isPublished: true,
        });
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDialogClose = (open) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className={`max-w-2xl max-h-[90vh] overflow-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                        Upload New Image
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Image Upload Area */}
                    <div className={`border-2 border-dashed ${isDarkMode ? "border-gray-700" : "border-gray-300"} rounded-lg p-4 text-center hover:border-blue-500 transition-colors`}>
                        {formData.imagePreview ? (
                            <div className="relative">
                                <img
                                    src={formData.imagePreview}
                                    alt="Preview"
                                    className="max-h-64 mx-auto rounded-lg"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, imagePreview: null, imageFile: null }));
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <Upload className={`w-12 h-12 ${isDarkMode ? "text-gray-500" : "text-gray-400"} mx-auto mb-4`} />
                                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                                    Click or drag and drop to upload
                                </p>
                                <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"} mt-1`}>
                                    JPG, PNG, WebP (Max 5MB)
                                </p>
                                <Button
                                    variant="outline"
                                    className={`mt-4 ${theme.button.outline}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Choose Image
                                </Button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-1">
                            <div className={`w-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                                <div
                                    className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} text-center`}>
                                {uploadProgress}% uploaded
                            </p>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className={theme.label}>Title *</Label>
                            <Input
                                placeholder="Enter image title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className={theme.input}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className={theme.label}>Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger className={theme.select}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className={theme.selectContent}>
                                    {CATEGORIES.map(category => (
                                        <SelectItem key={category.id} value={category.id} className={theme.selectItem}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className={theme.label}>Description</Label>
                        <Textarea
                            placeholder="Enter image description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className={theme.input}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublished"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="isPublished" className={theme.label}>
                            Publish immediately
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleDialogClose(false)}
                        className={theme.button.outline}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!formData.title || !formData.category || !formData.imageFile || isUploading}
                        className={theme.button.primary}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload Image"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}