// components/admin/directory/StuffManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetStaffQuery } from "@/features/apis/directoryApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { Calendar, Edit, Filter, GraduationCap, Phone, Plus, Search, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import StuffForm from "./components/StuffForm";

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
            default: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            inactive: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-700",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
            ghost: isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            danger: isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-red-600 hover:text-red-700 hover:bg-red-50",
        },
        avatar: {
            bg: isDarkMode ? "bg-blue-500/20" : "bg-blue-100",
            text: isDarkMode ? "text-blue-400" : "text-blue-600",
        },
    };
};

export default function StuffManager() {
    const theme = useTheme();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStuff, setEditingStuff] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        session: "",
        designation: "",
        isActive: "",
        page: 1,
        limit: 20
    });

    const { data, isLoading } = useGetStaffQuery();
    const stuff = data?.staff || [];

    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            handleApiError("Staff member deleted successfully");
        } catch (err) {
            handleApiError(err?.data?.message || "Failed to delete staff member");
        }
    };

    const handleEdit = (stuffItem) => {
        setEditingStuff(stuffItem);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingStuff(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingStuff(null);
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            session: "",
            designation: "",
            isActive: "",
            page: 1,
            limit: 20
        });
    };

    const hasActiveFilters = filters.search || filters.session || filters.designation || filters.isActive;

    // Get unique designations and sessions for filters
    const designations = [...new Set(stuff.map(s => s.designation))].filter(Boolean);
    const sessions = [...new Set(stuff.map(s => s.session))].filter(Boolean);

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    if (isLoading) {
        return (
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-6">
                    <div className={`text-center ${theme.textMuted}`}>Loading staff data...</div>
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
                            <CardTitle className={`text-2xl ${theme.text}`}>Staff Management</CardTitle>
                            <p className={theme.textMuted}>
                                Manage non-teaching staff members of the school
                            </p>
                        </div>
                        <Button onClick={handleAddNew} className={`flex items-center gap-2 ${theme.button.primary}`}>
                            <Plus className="w-4 h-4" />
                            Add Staff
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
                                    placeholder="Search staff..."
                                    value={filters.search}
                                    onChange={(e) => updateFilter('search', e.target.value)}
                                    className={`pl-10 ${inputClass}`}
                                />
                            </div>
                        </div>

                        {/* Designation */}
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${theme.textSecondary}`}>Designation</label>
                            <Select 
                                value={filters.designation ?? "all"}
                                onValueChange={(value) => updateFilter('designation', value == "all" ? undefined : value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All designations" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Designations</SelectItem>
                                    {designations.map(designation => (
                                        <SelectItem key={designation} value={designation} className={theme.select.item}>
                                            {designation}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Session */}
                        <div className="space-y-2">
                            <label className={`text-sm font-medium ${theme.textSecondary}`}>Session</label>
                            <Select 
                                value={filters.session ?? "all"}
                                onValueChange={(value) => updateFilter('session', value == "all" ? undefined : value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All sessions" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Sessions</SelectItem>
                                    {sessions.map(session => (
                                        <SelectItem key={session} value={session} className={theme.select.item}>
                                            {session}
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

            {/* Staff Table */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                <TableRow>
                                    <TableHead className={theme.textSecondary}>Name</TableHead>
                                    <TableHead className={theme.textSecondary}>Designation</TableHead>
                                    <TableHead className={theme.textSecondary}>Contact</TableHead>
                                    <TableHead className={theme.textSecondary}>Qualification</TableHead>
                                    <TableHead className={theme.textSecondary}>Session</TableHead>
                                    <TableHead className={theme.textSecondary}>Status</TableHead>
                                    <TableHead className={`text-right ${theme.textSecondary}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stuff.length === 0 ? (
                                    <TableRow className={theme.tableRow}>
                                        <TableCell colSpan={7} className={`text-center py-8 ${theme.textMuted}`}>
                                            {hasActiveFilters ? "No staff members match your filters" : "No staff members found. Add your first staff member to get started."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stuff.map((staff) => (
                                        <TableRow key={staff._id} className={`border-b ${theme.tableRow}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.avatar.bg}`}>
                                                        {staff.photo ? (
                                                            <img src={staff.photo} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                                                        ) : (
                                                            <User className={`w-5 h-5 ${theme.avatar.text}`} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={`font-medium ${theme.text}`}>{staff.name}</div>
                                                        <div className={`text-xs ${theme.textMuted}`}>
                                                            ID: {staff.nationalIdNo || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`font-normal ${theme.badge.outline}`}>
                                                        {staff.designation}
                                                    </Badge>
                                                    {staff.joiningDate && (
                                                        <div className={`text-xs ${theme.textMuted}`}>
                                                            Since {new Date(staff.joiningDate).getFullYear()}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className={`flex items-center gap-1 text-sm ${theme.textMuted}`}>
                                                        <Phone className="w-3 h-3" />
                                                        {staff.phoneNumber}
                                                    </div>
                                                    {staff.address && (
                                                        <div className={`text-xs ${theme.textMuted} truncate max-w-[150px]`}>
                                                            {staff.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {staff.lastQualification?.name ? (
                                                    <div className="space-y-1">
                                                        <div className={`flex items-center gap-1 ${theme.textMuted}`}>
                                                            <GraduationCap className="w-3 h-3" />
                                                            <span className={`text-sm ${theme.text}`}>{staff.lastQualification.name}</span>
                                                        </div>
                                                        <div className={`text-xs ${theme.textMuted}`}>
                                                            {staff.lastQualification.major} • {staff.lastQualification.institute}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className={theme.textMuted}>—</span>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <div className={`flex items-center gap-2 ${theme.textMuted}`}>
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{staff.session}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge 
                                                    variant={staff.isActive ? "default" : "outline"}
                                                    className={staff.isActive ? theme.badge.default : theme.badge.inactive}
                                                >
                                                    {staff.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(staff)}
                                                        className={`flex items-center gap-1 h-8 px-2 ${theme.button.ghost}`}
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(staff._id, staff.name)}
                                                        className={`flex items-center gap-1 h-8 px-2 ${theme.button.danger}`}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
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

            {/* Staff Form Dialog */}
            <StuffForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingStuff}
            />
        </div>
    );
}