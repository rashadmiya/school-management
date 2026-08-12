// components/admin/directory/CabinetManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCabinetQuery } from "@/features/apis/directoryApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { BookOpen, Edit, Filter, Plus, Search, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import CabinetForm from "./components/CabinetForm";
import { toast } from "sonner";

// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        bgSubtle: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
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
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
            default: isDarkMode ? "bg-blue-600 text-white" : "bg-blue-600 text-white",
            secondary: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-700",
            active: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            inactive: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-700",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            ghost: isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            danger: isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-red-600 hover:text-red-700 hover:bg-red-50",
        },
        avatar: {
            bg: isDarkMode ? "bg-emerald-500/20" : "bg-green-100",
            text: isDarkMode ? "text-emerald-400" : "text-green-600",
        },
        code: isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700",
    };
};

// Designation options with labels
const designationOptions = [
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "member", label: "Member" }
];

export default function CabinetManager({ classes = [] }) {
    const theme = useTheme();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        session: "",
        class: "",
        designation: "",
        isActive: "",
        page: 1,
        limit: 20
    });

    const { data, isLoading } = useGetCabinetQuery();
    const cabinet = data?.cabinet || [];

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to remove "${name}" from student cabinet?`)) return;
        try {
            toast.success("Cabinet member removed successfully");
        } catch (err) {
            handleApiError(err || "Failed to remove cabinet member");
        }
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingMember(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingMember(null);
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            session: "",
            class: "",
            designation: "",
            isActive: "",
            page: 1,
            limit: 20
        });
    };

    const hasActiveFilters = filters.search || filters.session || filters.class || filters.designation || filters.isActive;

    // Get unique sessions
    const sessions = [...new Set(cabinet.map(m => m.session))].filter(Boolean);

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    if (isLoading) {
        return (
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-6">
                    <div className={`text-center ${theme.textMuted}`}>Loading cabinet data...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            {/* Header */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className={`text-2xl ${theme.text}`}>Student Cabinet</CardTitle>
                            <p className={theme.textMuted}>
                                Manage student cabinet members and their positions
                            </p>
                        </div>
                        <Button onClick={handleAddNew} className={`flex items-center gap-2 ${theme.button.primary}`}>
                            <Plus className="w-4 h-4" />
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Filters */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                            <Filter className="w-4 h-4" />
                            Filters
                        </CardTitle>
                        {hasActiveFilters && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={clearFilters} 
                                className={`flex items-center gap-1 ${theme.button.ghost}`}
                            >
                                <X className="w-3 h-3" />
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${theme.textSecondary}`}>Search</label>
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                                <Input
                                    placeholder="Search members..."
                                    value={filters.search}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    className={`pl-10 ${inputClass}`}
                                />
                            </div>
                        </div>

                        {/* Class */}
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${theme.textSecondary}`}>Class</label>
                            <Select 
                                value={filters.class ?? "all"}
                                onValueChange={(value) => updateFilter('class', value == "all" ? undefined : value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All classes" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Classes</SelectItem>
                                    {classes.map(cls => (
                                        <SelectItem key={cls._id} value={cls._id} className={theme.select.item}>
                                            {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Designation */}
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${theme.textSecondary}`}>Position</label>
                            <Select 
                                value={filters.designation ?? "all"}
                                onValueChange={(value) => updateFilter('designation', value == "all" ? undefined : value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All positions" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Positions</SelectItem>
                                    {designationOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value} className={theme.select.item}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${theme.textSecondary}`}>Status</label>
                            <Select 
                                value={filters.isActive ?? "all"}
                                onValueChange={(value) => updateFilter('isActive', value == "all" ? undefined : value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All status" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Status</SelectItem>
                                    <SelectItem value="true" className={theme.select.item}>Active</SelectItem>
                                    <SelectItem value="false" className={theme.select.item}>Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cabinet Table */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                <TableRow>
                                    <TableHead className={theme.textSecondary}>Student</TableHead>
                                    <TableHead className={theme.textSecondary}>Class</TableHead>
                                    <TableHead className={theme.textSecondary}>Position</TableHead>
                                    <TableHead className={theme.textSecondary}>Roll Number</TableHead>
                                    <TableHead className={theme.textSecondary}>Session</TableHead>
                                    <TableHead className={theme.textSecondary}>Status</TableHead>
                                    <TableHead className={`text-right ${theme.textSecondary}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cabinet.length === 0 ? (
                                    <TableRow className={theme.tableRow}>
                                        <TableCell colSpan={7} className={`text-center py-8 ${theme.textMuted}`}>
                                            {hasActiveFilters ? "No cabinet members match your filters" : "No cabinet members found. Add your first member to get started."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cabinet.map((member) => {
                                        const designationLabel = designationOptions.find(d => d.value === member.designation)?.label || member.designation;
                                        return (
                                            <TableRow key={member._id} className={`border-b ${theme.tableRow}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.avatar.bg}`}>
                                                            <User className={`w-5 h-5 ${theme.avatar.text}`} />
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${theme.text}`}>{member.name}</div>
                                                            {member.student?.name && member.student.name !== member.name && (
                                                                <div className={`text-xs ${theme.textMuted}`}>
                                                                    As: {member.student.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className={`w-4 h-4 ${theme.textMuted}`} />
                                                        <div>
                                                            <div className={`font-medium ${theme.text}`}>{member.class?.name}</div>
                                                            {member.section?.name && (
                                                                <div className={`text-xs ${theme.textMuted}`}>
                                                                    Section: {member.section.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge 
                                                        variant={
                                                            member.designation === "president" ? "default" :
                                                            member.designation === "vice_president" ? "secondary" :
                                                            "outline"
                                                        }
                                                        className={
                                                            member.designation === "president" ? theme.badge.default :
                                                            member.designation === "vice_president" ? theme.badge.secondary :
                                                            theme.badge.outline
                                                        }
                                                    >
                                                        {designationLabel}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    <code className={`text-sm px-2 py-1 rounded ${theme.code}`}>
                                                        {member.rollNumber}
                                                    </code>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant="outline" className={`font-normal ${theme.badge.outline}`}>
                                                        {member.session}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge 
                                                        variant={member.isActive ? "default" : "outline"}
                                                        className={member.isActive ? theme.badge.active : theme.badge.inactive}
                                                    >
                                                        {member.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(member)}
                                                            className={`flex items-center gap-1 h-8 px-2 ${theme.button.ghost}`}
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(member._id, member.name)}
                                                            className={`flex items-center gap-1 h-8 px-2 ${theme.button.danger}`}
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
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

            {/* Cabinet Form Dialog */}
            <CabinetForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingMember}
                classes={classes}
            />
        </div>
    );
}