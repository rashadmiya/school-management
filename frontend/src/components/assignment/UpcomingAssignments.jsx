// components/assignment/UpcomingAssignments.jsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetUpcomingAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { useAppSelector } from "@/features/store";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, BookOpen } from "lucide-react";

// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        text: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        badge: {
            today: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
            tomorrow: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
            soon: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
            later: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
        },
        emptyIcon: isDarkMode ? "text-gray-600" : "text-gray-300",
        emptyText: isDarkMode ? "text-gray-400" : "text-gray-500",
        icon: isDarkMode ? "text-blue-400" : "text-blue-600",
        item: isDarkMode ? "border-gray-700" : "border-gray-200",
        divider: isDarkMode ? "border-gray-700" : "border-gray-200",
    };
};

export default function UpcomingAssignments({ limit = 5 }) {
    const theme = useTheme();
    const { data, isLoading } = useGetUpcomingAssignmentsQuery();

    const assignments = data?.assignments?.slice(0, limit) || [];

    const getDueText = (dueDate) => {
        const date = new Date(dueDate);
        
        if (isToday(date)) {
            return { text: 'Today', color: theme.badge.today };
        } else if (isTomorrow(date)) {
            return { text: 'Tomorrow', color: theme.badge.tomorrow };
        } else {
            const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
            return { 
                text: `In ${daysUntil} days`, 
                color: daysUntil <= 3 ? theme.badge.soon : theme.badge.later
            };
        }
    };

    if (isLoading) {
        return (
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-6">
                    <div className={`text-center ${theme.textMuted}`}>Loading assignments...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${theme.text}`}>
                    <Clock className="w-5 h-5" />
                    Upcoming Assignments
                </CardTitle>
            </CardHeader>
            <CardContent>
                {assignments.length === 0 ? (
                    <div className={`text-center py-4 ${theme.emptyText}`}>
                        <Calendar className={`w-12 h-12 mx-auto mb-2 ${theme.emptyIcon}`} />
                        <p>No upcoming assignments</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {assignments.map((assignment) => {
                            const dueInfo = getDueText(assignment.dueDate);
                            
                            return (
                                <div
                                    key={assignment._id}
                                    className={`flex items-start justify-between p-3 border rounded-lg ${theme.item} ${theme.bgHover}`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                            <BookOpen className={`w-4 h-4 ${theme.icon} mt-1 flex-shrink-0`} />
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`font-medium text-sm truncate ${theme.text}`}>
                                                    {assignment.title}
                                                </h4>
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    {assignment.class?.name} • {assignment.subject?.name}
                                                </p>
                                                <div className={`flex items-center gap-2 mt-1 ${theme.textMuted}`}>
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-xs">
                                                        Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Badge variant="outline" className={dueInfo.color}>
                                        {dueInfo.text}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {assignments.length > 0 && data?.count > limit && (
                    <div className={`mt-4 pt-3 border-t ${theme.divider}`}>
                        <p className={`text-sm text-center ${theme.textMuted}`}>
                            +{data.count - limit} more assignments
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}