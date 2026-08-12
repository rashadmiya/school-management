// components/assignment/AssignmentList.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteAssignmentMutation, useGetAssignmentsQuery } from "@/features/apis/assignmentsApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { format, isAfter, isBefore } from "date-fns";
import { BookOpen, Calendar, Edit, Filter, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import AssignmentForm from "./AssignmentForm";

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
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        tableHeader: isDarkMode ? "bg-gray-800" : "bg-gray-50",
        tableRow: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        badge: {
            active: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            overdue: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
            soon: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            destructive: isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" : "bg-red-500 text-white hover:bg-red-600",
        },
        emptyIcon: isDarkMode ? "text-gray-600" : "text-gray-300",
        bgRow: isDarkMode ? "bg-yellow-500/10" : "bg-yellow-50",
    };
};

export default function AssignmentList({ classes = [], subjects = [], showFilters = true }) {
    const theme = useTheme();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading, refetch } = useGetAssignmentsQuery(filters);
    const [deleteAssignment] = useDeleteAssignmentMutation();

    const assignments = data?.assignments || [];

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this assignment?")) return;
        try {
            await deleteAssignment(id).unwrap();
            refetch();
        } catch (err) {
            handleApiError(err || "Failed to delete assignment");
        }
    };

    const handleEdit = (assignment) => {
        setEditingAssignment(assignment);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingAssignment(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingAssignment(null);
        refetch();
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const getStatus = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);

        if (isAfter(due, now)) {
            return { label: 'Active', color: theme.badge.active };
        } else {
            return { label: 'Overdue', color: theme.badge.overdue };
        }
    };

    const isDueSoon = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        return isAfter(due, now) && isBefore(due, threeDaysFromNow);
    };

    // Filter assignments by search query
    const filteredAssignments = assignments.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.class?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        <div className="space-y-6">
            {/* Header and Filters */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className={`text-2xl ${theme.text}`}>Assignments</CardTitle>
                        <Button onClick={handleAddNew} className={`flex items-center gap-2 ${theme.button.primary}`}>
                            <Plus className="w-4 h-4" />
                            New Assignment
                        </Button>
                    </div>
                </CardHeader>

                {showFilters && (
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <Filter className={`w-4 h-4 ${theme.textMuted}`} />
                                <span className={`text-sm font-medium ${theme.textSecondary}`}>Filter by:</span>
                            </div>

                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textMuted} w-4 h-4`} />
                                <Input
                                    placeholder="Search assignment..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 ${inputClass}`}
                                />
                            </div>

                            <Select
                                onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)}
                            >
                                <SelectTrigger className={`w-32 ${theme.select.trigger}`}>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Classes</SelectItem>
                                    {classes.map((classItem) => (
                                        <SelectItem key={classItem._id} value={classItem._id} className={theme.select.item}>
                                            {classItem.name} {classItem.section ? `(${classItem.section})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(value) => updateFilter("subject", value === "all" ? undefined : value)}
                            >
                                <SelectTrigger className={`w-32 ${theme.select.trigger}`}>
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Subjects</SelectItem>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject._id} value={subject._id} className={theme.select.item}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                onValueChange={(value) => updateFilter("status", value === "all" ? undefined : value)}
                            >
                                <SelectTrigger className={`w-32 ${theme.select.trigger}`}>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Status</SelectItem>
                                    <SelectItem value="active" className={theme.select.item}>Active</SelectItem>
                                    <SelectItem value="overdue" className={theme.select.item}>Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Assignments Table */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                <TableRow>
                                    <TableHead className={theme.textSecondary}>Title</TableHead>
                                    <TableHead className={theme.textSecondary}>Class</TableHead>
                                    <TableHead className={theme.textSecondary}>Subject</TableHead>
                                    <TableHead className={theme.textSecondary}>Due Date</TableHead>
                                    <TableHead className={theme.textSecondary}>Status</TableHead>
                                    <TableHead className={theme.textSecondary}>Created By</TableHead>
                                    <TableHead className={`text-right ${theme.textSecondary}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssignments.length === 0 ? (
                                    <TableRow className={theme.tableRow}>
                                        <TableCell colSpan={7} className={`text-center py-8 ${theme.textMuted}`}>
                                            {searchQuery || Object.values(filters).some(f => f) ? (
                                                "No assignments found matching your criteria."
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <BookOpen className={`w-12 h-12 ${theme.emptyIcon}`} />
                                                    <p>No assignments found.</p>
                                                    <p className="text-sm">Create your first assignment to get started.</p>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAssignments.map((assignment) => {
                                        const status = getStatus(assignment.dueDate);
                                        const dueSoon = isDueSoon(assignment.dueDate);

                                        return (
                                            <TableRow 
                                                key={assignment._id} 
                                                className={`${theme.tableRow} ${dueSoon ? theme.bgRow : ''}`}
                                            >
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <div className={`flex items-center gap-2 ${theme.text}`}>
                                                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                            <span className="truncate font-medium">{assignment.title}</span>
                                                        </div>
                                                        {assignment.description && (
                                                            <p className={`text-sm ${theme.textMuted} truncate`}>
                                                                {assignment.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={theme.text}>
                                                    {assignment.class?.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className={`font-medium ${theme.text}`}>{assignment.subject?.name}</div>
                                                        <div className={`text-sm ${theme.textMuted}`}>{assignment.subject?.code}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-2 ${theme.textMuted}`}>
                                                        <Calendar className="w-4 h-4" />
                                                        <span className={dueSoon ? 'font-medium text-yellow-600 dark:text-yellow-400' : ''}>
                                                            {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                                                        </span>
                                                        {dueSoon && (
                                                            <Badge variant="outline" className={theme.badge.soon}>
                                                                Soon
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={status.color}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={theme.textMuted}>
                                                    {assignment.createdBy?.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(assignment)}
                                                            className={`flex items-center gap-1 ${theme.button.outline}`}
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(assignment._id)}
                                                            className={`flex items-center gap-1 ${theme.button.destructive}`}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Assignment Form Dialog */}
            <AssignmentForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingAssignment}
                classes={classes}
                subjects={subjects}
            />
        </div>
    );
}