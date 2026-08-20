// components/admin/HeroSliderUploadDialog.jsx
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/features/store";
import { Loader2 } from "lucide-react";

const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
        button: {
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            danger: isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" : "bg-red-500 text-white hover:bg-red-600",
        },
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function DeleteDialog({
    open,
    onOpenChange,
    isDeleting,
    handleDelete,
    selectedSlide,
}) {
    const theme = useTheme();


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={theme.dialog}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>Delete Slide</DialogTitle>
                </DialogHeader>
                <p className={theme.textMuted}>
                    Are you sure you want to delete "{selectedSlide?.title || 'Untitled'}"? This action cannot be undone.
                </p>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={theme.button.outline}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={theme.button.danger}
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
    );
}