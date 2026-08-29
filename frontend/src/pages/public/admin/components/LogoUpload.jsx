// components/admin/LogoUpload.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteLogoMutation, useUploadLogoMutation } from "@/features/apis/api";
import { useAppSelector } from "@/features/store";
import { backend_url } from "@/utils/server";
import { AlertCircle, Image, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

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
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        bgSubtle: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            danger: isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" : "bg-red-500 text-white hover:bg-red-600",
        },
    };
};

export default function LogoUpload({ currentLogo, onLogoUpdate }) {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [uploadLogo] = useUploadLogoMutation();
    const [deleteLogo] = useDeleteLogoMutation();

    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Please upload a valid image (JPEG, PNG, WebP, SVG)");
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                toast.error("Logo size should be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Auto-upload when file is selected
            handleUpload(file);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;
        
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("logo", file);

            // Simulate progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const result = await uploadLogo(formData).unwrap();
            clearInterval(interval);
            setUploadProgress(100);

            toast.success("Logo uploaded successfully");
            onLogoUpdate?.(result.data);
            setPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error?.data?.message || "Failed to upload logo");
            setPreview(null);
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete the current logo?")) return;

        setIsDeleting(true);
        try {
            await deleteLogo().unwrap();
            toast.success("Logo deleted successfully");
            onLogoUpdate?.(null);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(error?.data?.message || "Failed to delete logo");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className={`${theme.bg} ${theme.border} shadow-sm overflow-hidden`}>
                <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <Image className="w-5 h-5" />
                        School Logo
                    </CardTitle>
                    <CardDescription className={theme.textMuted}>
                        Upload your school logo to display on the website header and other branding areas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Logo Display */}
                    {currentLogo && (
                        <div className={`flex items-center gap-4 p-4 rounded-lg border ${theme.bgSubtle} ${theme.border}`}>
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                <img
                                    src={`${backend_url}${currentLogo}`}
                                    alt="Current Logo"
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        e.target.src = "https://placehold.co/80x80/e2e8f0/64748b?text=Logo";
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${theme.text}`}>Current Logo</p>
                                <p className={`text-xs ${theme.textMuted}`}>
                                    {currentLogo.split('/').pop()}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`${theme.button.danger}`}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <X className="w-4 h-4 mr-1" />
                                        Remove
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className={`border-2 border-dashed ${theme.border} rounded-lg p-6 text-center hover:border-blue-500 transition-colors`}>
                        {isUploading ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                                <div className="w-full max-w-md mx-auto">
                                    <div className={`w-full ${theme.border} rounded-full h-2`}>
                                        <div
                                            className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className={`text-sm ${theme.textMuted} mt-1`}>
                                        {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Upload complete!"}
                                    </p>
                                </div>
                            </div>
                        ) : preview ? (
                            <div className="relative">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-32 mx-auto rounded-lg object-contain"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setPreview(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <Upload className={`w-12 h-12 ${theme.icon} mx-auto mb-3`} />
                                <p className={theme.textSecondary}>Click or drag and drop to upload</p>
                                <p className={`text-sm ${theme.textMuted} mt-1`}>
                                    JPG, PNG, WebP, SVG (Max 2MB)
                                </p>
                                <Button
                                    variant="outline"
                                    className={`mt-4 ${theme.button.outline}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    Choose Logo
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

                    <Alert className={`${theme.bgSubtle} ${theme.border}`}>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className={`text-sm ${theme.textMuted}`}>
                            <p><strong>Recommended:</strong> Square logo (1:1 ratio) or rectangular (4:1 ratio)</p>
                            <p className="mt-1">For best results, use a transparent PNG or SVG with dimensions between 200x200 and 500x500 pixels.</p>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
}