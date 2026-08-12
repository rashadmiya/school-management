// components/admin/directory/SectionManager.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash2, Plus, LayoutGrid, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import SectionForm from "@/components/section/SectionForm";
import { useGetSectionsQuery } from "@/features/apis/sectionsApi";
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
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        tableHeader: isDarkMode ? "bg-gray-800" : "bg-gray-50",
        tableRow: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
        badge: {
            active: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            inactive: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-700",
            full: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
            ghost: isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            danger: isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-red-600 hover:text-red-700 hover:bg-red-50",
        },
        stat: {
            blue: isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-blue-50 text-blue-600",
            green: isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-green-50 text-green-600",
            purple: isDarkMode 
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                : "bg-purple-50 text-purple-600",
            orange: isDarkMode 
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400" 
                : "bg-orange-50 text-orange-600",
        },
        progress: {
            bg: isDarkMode ? "bg-gray-700" : "bg-gray-200",
            high: "bg-red-500",
            medium: "bg-yellow-500",
            low: "bg-emerald-500",
        },
        avatar: {
            bg: isDarkMode ? "bg-blue-500/20" : "bg-blue-100",
            text: isDarkMode ? "text-blue-400" : "text-blue-600",
        },
    };
};

export default function SectionManager({ classes = [] }) {
    const theme = useTheme();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data, isLoading } = useGetSectionsQuery();
    const sections = data?.sections || [];

    const handleDelete = async (id, name) => {
        // Check if section is used in any class
        const usedInClasses = classes.filter(c => c.section?._id === id);
        if (usedInClasses.length > 0) {
            const classNames = usedInClasses.map(c => c.name).join(', ');
            toast.error(`Cannot delete section. It is used in classes: ${classNames}`);
            return;
        }

        if (!confirm(`Are you sure you want to delete section "${name}"?`)) return;
        try {
            toast.success("Section deleted successfully");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to delete section");
        }
    };

    const handleEdit = (section) => {
        setEditingSection(section);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingSection(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingSection(null);
    };

    const filteredSections = sections.filter(section =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate statistics
    const stats = {
        totalSections: sections.length,
        activeSections: sections.filter(s => s.isActive).length,
        totalCapacity: sections.reduce((sum, s) => sum + s.capacity, 0),
        totalStudents: sections.reduce((sum, s) => sum + s.currentStrength, 0),
        usagePercentage: Math.round((sections.reduce((sum, s) => sum + s.currentStrength, 0) / 
            sections.reduce((sum, s) => sum + s.capacity, 0)) * 100) || 0
    };

    // Input base class
    const inputClass = `${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`;

    if (isLoading) {
        return (
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-6">
                    <div className={`text-center ${theme.textMuted}`}>Loading sections data...</div>
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
                            <CardTitle className={`text-2xl ${theme.text}`}>Section Management</CardTitle>
                            <p className={theme.textMuted}>
                                Manage class sections and their capacities
                            </p>
                        </div>
                        <Button onClick={handleAddNew} className={`flex items-center gap-2 ${theme.button.primary}`}>
                            <Plus className="w-4 h-4" />
                            Add Section
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme.textMuted}`}>Total Sections</p>
                                <p className={`text-2xl font-bold ${theme.text}`}>{stats.totalSections}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.stat.blue}`}>
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme.textMuted}`}>Active Sections</p>
                                <p className={`text-2xl font-bold ${theme.text}`}>{stats.activeSections}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.stat.green}`}>
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme.textMuted}`}>Total Capacity</p>
                                <p className={`text-2xl font-bold ${theme.text}`}>{stats.totalCapacity}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.stat.purple}`}>
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme.textMuted}`}>Usage Rate</p>
                                <p className={`text-2xl font-bold ${theme.text}`}>{stats.usagePercentage}%</p>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${theme.stat.orange}`}>
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="p-4">
                    <div className="relative max-w-sm">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textMuted} w-4 h-4`} />
                        <Input
                            placeholder="Search sections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-10 ${inputClass}`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Sections Table */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                <TableRow>
                                    <TableHead className={theme.textSecondary}>Section Name</TableHead>
                                    <TableHead className={theme.textSecondary}>Capacity</TableHead>
                                    <TableHead className={theme.textSecondary}>Current Strength</TableHead>
                                    <TableHead className={theme.textSecondary}>Usage</TableHead>
                                    <TableHead className={theme.textSecondary}>Status</TableHead>
                                    <TableHead className={`text-right ${theme.textSecondary}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSections.length === 0 ? (
                                    <TableRow className={theme.tableRow}>
                                        <TableCell colSpan={6} className={`text-center py-8 ${theme.textMuted}`}>
                                            {searchQuery ? (
                                                "No sections found matching your search."
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <LayoutGrid className={`w-12 h-12 ${theme.textMuted}`} />
                                                    <p>No sections found.</p>
                                                    <p className="text-sm">Create your first section to get started.</p>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSections.map((section) => {
                                        const usagePercentage = Math.round((section.currentStrength / section.capacity) * 100);
                                        const isFull = section.currentStrength >= section.capacity;
                                        
                                        return (
                                            <TableRow key={section._id} className={`border-b ${theme.tableRow}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.avatar.bg}`}>
                                                            <span className={`font-bold ${theme.avatar.text}`}>{section.name.slice(0, 3)}</span>
                                                        </div>
                                                        <div className={`font-medium ${theme.text}`}>{section.name}</div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className={`text-lg font-semibold ${theme.text}`}>{section.capacity}</div>
                                                    <div className={`text-sm ${theme.textMuted}`}>students</div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className={`flex items-center gap-2 ${theme.textMuted}`}>
                                                        <Users className="w-4 h-4" />
                                                        <div>
                                                            <div className={`font-semibold ${theme.text}`}>{section.currentStrength}</div>
                                                            <div className={`text-sm ${theme.textMuted}`}>enrolled</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="space-y-2">
                                                        <div className={`flex justify-between text-sm ${theme.textMuted}`}>
                                                            <span>{usagePercentage}%</span>
                                                            <span>{section.currentStrength}/{section.capacity}</span>
                                                        </div>
                                                        <div className={`w-full ${theme.progress.bg} rounded-full h-2`}>
                                                            <div 
                                                                className={`h-2 rounded-full ${
                                                                    usagePercentage >= 90 ? theme.progress.high :
                                                                    usagePercentage >= 75 ? theme.progress.medium :
                                                                    theme.progress.low
                                                                }`}
                                                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        {isFull && (
                                                            <Badge variant="destructive" className={`text-xs ${theme.badge.full}`}>
                                                                Full
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {section.isActive ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                                                <Badge variant="default" className={theme.badge.active}>
                                                                    Active
                                                                </Badge>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                                <Badge variant="outline" className={theme.badge.inactive}>
                                                                    Inactive
                                                                </Badge>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(section)}
                                                            className={`flex items-center gap-1 h-8 px-2 ${theme.button.ghost}`}
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(section._id, section.name)}
                                                            className={`flex items-center gap-1 h-8 px-2 ${theme.button.danger}`}
                                                            title="Delete"
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

            {/* Section Form Dialog */}
            <SectionForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingSection}
            />
        </div>
    );
}