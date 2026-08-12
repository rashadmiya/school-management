// pages/AssignmentsPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssignmentList from "@/components/assignment/AssignmentList";
import UpcomingAssignments from "@/components/assignment/UpcomingAssignments";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeacherAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, AlertTriangle, Plus, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/features/store";

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
        badge: {
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
            total: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
            active: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            overdue: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
        },
        tabs: {
            list: isDarkMode ? "bg-gray-800" : "bg-gray-100",
            trigger: isDarkMode 
                ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white" 
                : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900",
        },
        stat: {
            blue: isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-blue-50 text-blue-600",
            green: isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-green-50 text-green-600",
            red: isDarkMode 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-red-50 text-red-600",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
        },
        emptyIcon: isDarkMode ? "text-gray-600" : "text-gray-300",
        emptyText: isDarkMode ? "text-gray-400" : "text-gray-500",
    };
};

export default function AssignmentsPage() {
    const theme = useTheme();
    const [selectedClass, setSelectedClass] = useState(null);
    
    const { data: classesData } = useGetClassesQuery();
    const { data: subjectsData } = useGetSubjectsQuery();
    const { data: teacherAssignments } = useGetTeacherAssignmentsQuery();

    const classes = classesData?.classes || classesData?.docs || [];
    const subjects = subjectsData?.subjects || subjectsData?.docs || [];
    const stats = teacherAssignments?.statistics;

    useEffect(() => {
        if (classes.length > 0 && !selectedClass) {
            setSelectedClass(classes[0]);
        }
    }, [classes, selectedClass]);

    return (
        <div className={`container space-y-6 ${theme.text}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${theme.text}`}>Assignment Management</h1>
                    <p className={theme.textMuted}>
                        Create, manage, and track academic assignments
                    </p>
                </div>
                
                {/* Teacher Stats */}
                {stats && (
                    <div className="flex gap-4">
                        <div className={`text-center p-3 rounded-lg border ${theme.stat.blue}`}>
                            <p className={`text-2xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                                {stats.total}
                            </p>
                            <p className={`text-sm ${theme.textMuted}`}>Total</p>
                        </div>
                        <div className={`text-center p-3 rounded-lg border ${theme.stat.green}`}>
                            <p className={`text-2xl font-bold ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
                                {stats.active}
                            </p>
                            <p className={`text-sm ${theme.textMuted}`}>Active</p>
                        </div>
                        <div className={`text-center p-3 rounded-lg border ${theme.stat.red}`}>
                            <p className={`text-2xl font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                                {stats.overdue}
                            </p>
                            <p className={`text-sm ${theme.textMuted}`}>Overdue</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-4">
                    <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className={theme.tabs.list}>
                            <TabsTrigger value="all" className={theme.tabs.trigger}>All</TabsTrigger>
                            <TabsTrigger value="active" className={theme.tabs.trigger}>Active</TabsTrigger>
                            <TabsTrigger value="overdue" className={theme.tabs.trigger}>Overdue</TabsTrigger>
                            <TabsTrigger value="my" className={theme.tabs.trigger}>My Assignments</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <AssignmentList 
                                classes={classes}
                                subjects={subjects}
                                showFilters={true}
                                isDarkMode={theme.isDarkMode}
                            />
                        </TabsContent>

                        <TabsContent value="active">
                            <AssignmentList 
                                classes={classes}
                                subjects={subjects}
                                showFilters={false}
                                isDarkMode={theme.isDarkMode}
                            />
                        </TabsContent>

                        <TabsContent value="overdue">
                            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                                <CardContent className="p-12 text-center">
                                    <AlertTriangle className={`w-16 h-16 mx-auto mb-4 ${theme.emptyIcon}`} />
                                    <p className={`text-lg ${theme.emptyText}`}>Overdue Assignments</p>
                                    <p className={`text-sm ${theme.textMuted} mt-2`}>
                                        View and manage overdue assignments
                                    </p>
                                    <Button className={`mt-4 ${theme.button.primary}`}>
                                        View Overdue
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="my">
                            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                                <CardContent className="p-12 text-center">
                                    <BookOpen className={`w-16 h-16 mx-auto mb-4 ${theme.emptyIcon}`} />
                                    <p className={`text-lg ${theme.emptyText}`}>My Assignments</p>
                                    <p className={`text-sm ${theme.textMuted} mt-2`}>
                                        View assignments created by you
                                    </p>
                                    <Button className={`mt-4 ${theme.button.primary}`}>
                                        View My Assignments
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <UpcomingAssignments isDarkMode={theme.isDarkMode} />
                    
                    {/* Quick Stats */}
                    <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                        <CardHeader>
                            <CardTitle className={`text-lg ${theme.text}`}>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className={`flex justify-between items-center ${theme.border} pb-2 border-b`}>
                                <span className={theme.textMuted}>Total Classes</span>
                                <Badge variant="outline" className={theme.badge.outline}>
                                    {classes.length}
                                </Badge>
                            </div>
                            <div className={`flex justify-between items-center ${theme.border} pb-2 border-b`}>
                                <span className={theme.textMuted}>Total Subjects</span>
                                <Badge variant="outline" className={theme.badge.outline}>
                                    {subjects.length}
                                </Badge>
                            </div>
                            <div className={`flex justify-between items-center ${theme.border} pb-2 border-b`}>
                                <span className={theme.textMuted}>Active Assignments</span>
                                <Badge className={theme.badge.active}>
                                    {stats?.active || 0}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme.textMuted}>Overdue Assignments</span>
                                <Badge className={theme.badge.overdue}>
                                    {stats?.overdue || 0}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Action */}
                    <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                        <CardHeader>
                            <CardTitle className={`text-lg ${theme.text}`}>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className={`w-full ${theme.button.primary}`}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Assignment
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}