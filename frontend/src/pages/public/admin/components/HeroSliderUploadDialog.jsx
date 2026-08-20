// components/admin/HeroSliderUploadDialog.jsx
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
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/features/store";
import { Loader2, Upload, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "react-toastify";

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
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
        button: {
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
        },
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function HeroSliderUploadDialog({
    open,
    onOpenChange,
    formData,
    setFormData,
    onUpload,
    isUploading,
    uploadProgress,
}) {
    const theme = useTheme();
    const fileInputRef = useRef(null);

    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Please upload a valid image (JPEG, PNG, WebP)");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    imageFile: file,
                    imagePreview: e.target.result,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className={theme.text}>Upload Hero Slide</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Image Upload Area */}
                    <div className={`border-2 border-dashed ${theme.border} rounded-lg p-8 text-center hover:border-blue-500 transition-colors`}>
                        {formData.imagePreview ? (
                            <div className="relative">
                                <img
                                    src={formData.imagePreview}
                                    alt="Preview"
                                    className="max-h-64 mx-auto rounded-lg object-contain"
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
                                <Upload className={`w-12 h-12 ${theme.icon} mx-auto mb-4`} />
                                <p className={theme.textSecondary}>Click or drag and drop to upload</p>
                                <p className={`text-sm ${theme.textMuted} mt-1`}>JPG, PNG, WebP (Max 5MB)</p>
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

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Title</Label>
                            <Input
                                placeholder="Slide title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={theme.textSecondary}>Link Text</Label>
                            <Input
                                placeholder="e.g., Learn More"
                                value={formData.linkText}
                                onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={theme.textSecondary}>Subtitle</Label>
                        <Textarea
                            placeholder="Slide subtitle or description"
                            value={formData.subtitle}
                            onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                            rows={2}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className={theme.textSecondary}>Link URL</Label>
                        <Input
                            placeholder="/about or https://example.com"
                            value={formData.link}
                            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                            className={inputClass}
                        />
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-2">
                            <div className={`w-full ${theme.border} rounded-full h-2`}>
                                <div
                                    className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className={`text-sm ${theme.textMuted} text-center`}>{uploadProgress}% uploaded</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={theme.button.outline}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onUpload}
                        disabled={!formData.imageFile || isUploading}
                        className={theme.button.primary}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload Slide"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}