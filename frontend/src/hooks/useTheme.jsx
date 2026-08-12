import { useAppSelector } from "@/features/store";

export const useTheme = () => {
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
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
        },
        switch: isDarkMode ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" : "",
        alert: isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-yellow-800",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        tableHeader: isDarkMode ? "bg-gray-800" : "bg-gray-50",
        tableRow: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        badge: {
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
            default: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
        },
        loading: isDarkMode ? "border-blue-400" : "border-blue-600",
        icon: isDarkMode ? "text-blue-400" : "text-blue-600",
        dialog: isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white",
        input: isDarkMode
            ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            : "bg-white border-gray-300 text-gray-900",
        label: isDarkMode ? "text-gray-300" : "text-gray-700",
        description: isDarkMode ? "text-gray-400":"text-gray-700"
    };
};