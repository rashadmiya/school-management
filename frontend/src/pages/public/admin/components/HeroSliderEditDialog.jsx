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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/features/store";
import { backend_url } from "@/utils/server";
import { Loader2 } from "lucide-react";

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

export default function HeroSliderEditDialog({
    open,
    onOpenChange,
    formData,
    setFormData,
    handleUpdate,
    selectedSlide,
    isUpdating
}) {
    const theme = useTheme();

    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>Edit Slide</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {selectedSlide && (
                        <>
                            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <img
                                    src={`${backend_url}${selectedSlide.imageUrl}`}
                                    alt={selectedSlide.title}
                                    className="w-24 h-16 object-cover rounded"
                                />
                                <div>
                                    <p className={`font-medium ${theme.text}`}>{selectedSlide.title || "Untitled"}</p>
                                    <p className={`text-sm ${theme.textMuted}`}>Current image</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className={theme.textSecondary}>Link Text</Label>
                                    <Input
                                        value={formData.linkText}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Subtitle</Label>
                                <Textarea
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className={theme.textSecondary}>Link URL</Label>
                                <Input
                                    value={formData.link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className={theme.textSecondary}>Status</Label>
                                    <p className={`text-sm ${theme.textMuted}`}>
                                        {formData.isActive ? "Slide is active and visible" : "Slide is inactive and hidden"}
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={theme.button.outline}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className={theme.button.primary}
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}