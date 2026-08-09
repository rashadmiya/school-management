// pages/ExamRoutinePage.jsx - For Admin Management Only with Dark Mode
import ExamRoutineForm from "@/components/exam/ExamRoutineForm";
import ExamRoutinePDF from "@/components/PDFExporters/ExamRoutinePDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteExamRoutineMutation, useGetExamRoutinesQuery, usePublishExamRoutineMutation } from "@/features/apis/examRoutineApi";
import { useAppSelector } from "@/features/store";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Calendar, Clock, Download, Edit, Filter, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function ExamRoutinePage() {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [filters, setFilters] = useState({
        examType: "",
        class: "",
        academicYear: "",
        isPublished: ""
    });
    
    const { data, isLoading, refetch } = useGetExamRoutinesQuery(filters);
    const [deleteExamRoutine] = useDeleteExamRoutineMutation();
    const [publishExamRoutine] = usePublishExamRoutineMutation();

    const exams = data?.examRoutines || [];

    // Theme-based classes
    const theme = {
        textPrimary: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        badge: {
            blue: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
            red: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
            green: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            yellow: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
            purple: isDarkMode ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-800",
            gray: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800",
        },
        stat: {
            blue: isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-blue-50 text-blue-600",
            green: isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-green-50 text-green-600",
            yellow: isDarkMode 
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" 
                : "bg-yellow-50 text-yellow-600",
            purple: isDarkMode 
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                : "bg-purple-50 text-purple-600",
        },
        select: isDarkMode 
            ? "bg-gray-800 border-gray-700 text-white" 
            : "bg-white border-gray-200 text-gray-900",
        button: {
            default: isDarkMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode 
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
                : "border-gray-200 text-gray-700 hover:bg-gray-50",
            destructive: isDarkMode 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" 
                : "bg-red-500 text-white hover:bg-red-600",
            ghost: isDarkMode 
                ? "text-gray-400 hover:text-white hover:bg-gray-800" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        },
        switch: isDarkMode 
            ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-700" 
            : "",
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this exam routine?")) return;
        try {
            await deleteExamRoutine(id).unwrap();
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to delete exam routine");
        }
    };

    const handleEdit = (exam) => {
        setEditingExam(exam);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingExam(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingExam(null);
        refetch();
    };

    const handlePublishToggle = async (exam) => {
        try {
            await publishExamRoutine({ 
                id: exam._id, 
                isPublished: !exam.isPublished 
            }).unwrap();
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update publish status");
        }
    };

    const getExamTypeColor = (type) => {
        const colors = {
            midterm: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
            final: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
            term: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            weekly: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
            monthly: isDarkMode ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-800",
            others: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800"
        };
        return colors[type] || (isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const clearFilters = () => {
        setFilters({
            examType: "",
            class: "",
            academicYear: "",
            isPublished: ""
        });
    };

    const getUniqueValues = (key) => {
        if (key === 'class' || key === 'subject') {
            const values = new Set(exams.map(exam => exam[key]?._id || exam[key]));
            return Array.from(values).filter(Boolean);
        }
        const values = new Set(exams.map(exam => exam[key]));
        return Array.from(values).filter(Boolean);
    };

    if (isLoading) {
        return (
            <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
                <CardContent className="p-6">
                    <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Loading exam routines...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`container space-y-6 ${isDarkMode ? "text-white" : ""}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Exam Routine Management
                    </h1>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                        Manage examination schedules and monitoring duties
                    </p>
                </div>
                <Button onClick={handleAddNew} className={`flex items-center gap-2 ${theme.button.default}`}>
                    <Plus className="w-4 h-4" />
                    Add Exam
                </Button>
            </div>

            {/* Filters */}
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                            <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                Filters:
                            </span>
                        </div>
                        
                        <Select onValueChange={(value) => updateFilter("examType", value === "all" ? undefined : value)} value={filters.examType || "all"}>
                            <SelectTrigger className={`w-40 ${theme.select}`}>
                                <SelectValue placeholder="Exam Type" />
                            </SelectTrigger>
                            <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                                <SelectItem value="all" className={isDarkMode ? "text-gray-300" : ""}>All Types</SelectItem>
                                {getUniqueValues("examType").map(type => (
                                    <SelectItem key={type} value={type} className={isDarkMode ? "text-gray-300" : ""}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)} value={filters.class || "all"}>
                            <SelectTrigger className={`w-40 ${theme.select}`}>
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                                <SelectItem value="all" className={isDarkMode ? "text-gray-300" : ""}>All Classes</SelectItem>
                                {getUniqueValues("class").map(classId => {
                                    const exam = exams.find(e => e.class?._id === classId);
                                    return (
                                        <SelectItem key={classId} value={classId} className={isDarkMode ? "text-gray-300" : ""}>
                                            {exam?.class?.name || classId}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => updateFilter("isPublished", value === "all" ? undefined : value)} value={filters.isPublished || "all"}>
                            <SelectTrigger className={`w-40 ${theme.select}`}>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                                <SelectItem value="all" className={isDarkMode ? "text-gray-300" : ""}>All Status</SelectItem>
                                <SelectItem value="true" className={isDarkMode ? "text-gray-300" : ""}>Published</SelectItem>
                                <SelectItem value="false" className={isDarkMode ? "text-gray-300" : ""}>Draft</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Academic Year (e.g., 2024-2025)"
                            className={`w-48 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" : ""}`}
                            value={filters.academicYear || ""}
                            onChange={(e) => updateFilter("academicYear", e.target.value)}
                        />

                        <Button variant="outline" onClick={clearFilters} className={theme.button.outline}>
                            Clear
                        </Button>

                        {exams.length > 0 && (
                            <PDFDownloadLink
                                document={<ExamRoutinePDF exams={exams} adminView={true} />}
                                fileName={`exam-routines-management-${new Date().getFullYear()}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button variant="outline" disabled={loading} className={`flex items-center gap-2 ml-auto ${theme.button.outline}`}>
                                        <Download className="w-4 h-4" />
                                        {loading ? "Generating..." : "Export PDF"}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Exams Table */}
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                                <TableRow className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Exam Title</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Type</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Date & Time</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Class</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Subject</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Room</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Monitoring</TableHead>
                                    <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Status</TableHead>
                                    <TableHead className={`text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.length === 0 ? (
                                    <TableRow className={isDarkMode ? "border-gray-800" : ""}>
                                        <TableCell colSpan={9} className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            No exam routines found. Create your first exam routine.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exams.map((exam) => (
                                        <TableRow 
                                            key={exam._id} 
                                            className={`${isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                                        >
                                            <TableCell>
                                                <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                    {exam.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getExamTypeColor(exam.examType)}>
                                                    {exam.examType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{formatDate(exam.examDate)}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                        <Clock className="w-3 h-3" />
                                                        <span>{exam.startTime} - {exam.endTime}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                                                {exam.class?.name} 
                                                {exam.class?.section?.name && ` (${exam.class.section.name})`}
                                            </TableCell>
                                            <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                                                {exam.subject?.name}
                                            </TableCell>
                                            <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                                                {exam.roomNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    <Users className="w-3 h-3" />
                                                    <span>{exam.monitoringTeachers?.length || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={exam.isPublished}
                                                        onCheckedChange={() => handlePublishToggle(exam)}
                                                        size="sm"
                                                        className={theme.switch}
                                                    />
                                                    <Badge variant={exam.isPublished ? "default" : "secondary"} className={isDarkMode && !exam.isPublished ? "bg-gray-700 text-gray-300 border-gray-600" : ""}>
                                                        {exam.isPublished ? "Published" : "Draft"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(exam)}
                                                        className={`flex items-center gap-1 ${theme.button.ghost}`}
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(exam._id)}
                                                        className={`flex items-center gap-1 ${theme.button.destructive}`}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Summary */}
            {exams.length > 0 && (
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className={`text-center p-4 rounded-lg border ${theme.stat.blue}`}>
                                <p className={`text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>Total Exams</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                                    {exams.length}
                                </p>
                            </div>
                            <div className={`text-center p-4 rounded-lg border ${theme.stat.green}`}>
                                <p className={`text-sm font-medium ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>Published</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-emerald-400" : "text-green-700"}`}>
                                    {exams.filter(e => e.isPublished).length}
                                </p>
                            </div>
                            <div className={`text-center p-4 rounded-lg border ${theme.stat.yellow}`}>
                                <p className={`text-sm font-medium ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>Drafts</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                                    {exams.filter(e => !e.isPublished).length}
                                </p>
                            </div>
                            <div className={`text-center p-4 rounded-lg border ${theme.stat.purple}`}>
                                <p className={`text-sm font-medium ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>Total Monitoring Duties</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
                                    {exams.reduce((sum, exam) => sum + (exam.monitoringTeachers?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <ExamRoutineForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingExam}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}