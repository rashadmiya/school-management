// components/subject/SubjectList.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Edit, Trash2, Plus, Eye, BookOpen, Users, Calendar, ArrowUpDown } from "lucide-react";
import { 
  useGetSubjectsQuery, 
  useDeleteSubjectMutation,
  useGetSubjectsStatsQuery,
  useGetSubjectsWithoutClassesQuery
} from "@/features/apis/subjectsApi";
import SubjectForm from "./SubjectForm";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppSelector } from "@/features/store";

export default function SubjectList({ classes = [] }) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    classId: "",
    hasClasses: "",
    page: 1,
    limit: 20,
    sortBy: "name",
    sortOrder: "asc"
  });
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useGetSubjectsQuery(filters);
  const { data: statsData } = useGetSubjectsStatsQuery();
  const { data: subjectsWithoutClasses } = useGetSubjectsWithoutClassesQuery();
  
  const subjects = data?.subjects || [];
  const statistics = data?.statistics || {};
  const [deleteSubject] = useDeleteSubjectMutation();

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
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
      secondary: isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "",
      noClass: isDarkMode 
        ? "border-orange-500/30 text-orange-400 bg-orange-500/10" 
        : "border-orange-200 text-orange-600 bg-orange-50",
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subject? This will remove all associations with classes and teachers.")) return;
    try {
      await deleteSubject(id).unwrap();
      toast.success("Subject deleted successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete subject");
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSubject(null);
    refetch();
  };

  const handleViewDetails = (subjectId) => {
    navigate(`/admin/subjects/${subjectId}`);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      classId: "",
      hasClasses: "",
      page: 1,
      limit: 20,
      sortBy: "name",
      sortOrder: "asc"
    });
  };

  const toggleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  };

  const hasActiveFilters = filters.search || filters.classId || filters.hasClasses;

  if (isLoading) {
    return (
      <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
        <CardContent className="p-6">
          <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading subjects...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className={`text-2xl ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Subject Management
              </CardTitle>
              <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                {statistics.totalSubjects} total subjects, {statistics.withClasses} assigned to classes
              </CardDescription>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Total Subjects
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {statistics.totalSubjects || 0}
              </div>
            </div>
            <div className="space-y-2">
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                With Classes
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {statistics.withClasses || 0}
              </div>
            </div>
            <div className="space-y-2">
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Class Coverage
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {statistics.classCoverage || 0}%
              </div>
            </div>
            <div className="space-y-2">
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Without Classes
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {subjectsWithoutClasses?.count || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className={`flex items-center gap-1 ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : ""}`}
              >
                <X className="w-3 h-3" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Search
              </label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <Input
                  placeholder="Search subjects..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className={`pl-10 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" : ""}`}
                />
              </div>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Class
              </label>
              <Select 
                value={filters.classId ?? "all"} 
                onValueChange={(value) => updateFilter('classId', value == "all" ? undefined : value)}
              >
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectItem value="all" className={isDarkMode ? "text-gray-300" : ""}>All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls._id} value={cls._id} className={isDarkMode ? "text-gray-300" : ""}>
                      {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Has Classes Filter */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Class Assignment
              </label>
              <Select 
                value={filters.hasClasses ?? "all"} 
                onValueChange={(value) => updateFilter('hasClasses', value == "all" ? undefined : value)}
              >
                <SelectTrigger className={isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                  <SelectItem value="all" className={isDarkMode ? "text-gray-300" : ""}>All Subjects</SelectItem>
                  <SelectItem value="true" className={isDarkMode ? "text-gray-300" : ""}>With Classes</SelectItem>
                  <SelectItem value="false" className={isDarkMode ? "text-gray-300" : ""}>Without Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                <TableRow className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                  <TableHead className={`cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">
                      Subject Name
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Code</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Assigned Classes</TableHead>
                  <TableHead className={`cursor-pointer ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} onClick={() => toggleSort("createdAt")}>
                    <div className="flex items-center gap-1">
                      Created
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Description</TableHead>
                  <TableHead className={`text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow className={isDarkMode ? "border-gray-800" : ""}>
                    <TableCell colSpan={6} className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {hasActiveFilters ? "No subjects match your filters" : "No subjects found. Create your first subject to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => (
                    <TableRow 
                      key={subject._id} 
                      className={`${isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <div>
                            <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {subject.name}
                            </div>
                            {subject.code && (
                              <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                ID: {subject._id?.slice(-6)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className={isDarkMode ? "text-gray-300" : ""}>
                        {subject.code ? (
                          <Badge variant="outline" className={`font-mono ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
                            {subject.code}
                          </Badge>
                        ) : (
                          <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {subject.classes?.length > 0 ? (
                          <div className="space-y-1">
                            <div className={`flex items-center gap-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              <Users className="w-4 h-4" />
                              <span className="font-medium">{subject.classes.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {subject.classes.slice(0, 3).map((cls) => (
                                <Badge 
                                  key={cls._id} 
                                  variant="secondary" 
                                  className={`text-xs ${isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : ""}`}
                                >
                                  {cls.name}
                                </Badge>
                              ))}
                              {subject.classes.length > 3 && (
                                <Badge variant="outline" className={`text-xs ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
                                  +{subject.classes.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className={`text-xs ${isDarkMode ? "border-orange-500/30 text-orange-400 bg-orange-500/10" : "border-orange-200 text-orange-600 bg-orange-50"}`}>
                            No Classes
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className={`flex items-center gap-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <Calendar className="w-4 h-4" />
                          <div>
                            <div className="text-sm">
                              {new Date(subject.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[200px]">
                        <div className={`truncate ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {subject.description || (
                            <span className={isDarkMode ? "text-gray-500 italic" : "text-gray-400 italic"}>
                              No description
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(subject._id)}
                            className={`flex items-center gap-1 h-8 px-2 ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : ""}`}
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(subject)}
                            className={`flex items-center gap-1 h-8 px-2 ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : ""}`}
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(subject._id)}
                            className={`flex items-center gap-1 h-8 px-2 ${
                              isDarkMode 
                                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                                : "text-red-600 hover:text-red-700 hover:bg-red-50"
                            }`}
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

          {/* Pagination */}
          {data?.total > filters.limit && (
            <div className={`flex items-center justify-between p-4 border-t ${isDarkMode ? "border-gray-800" : ""}`}>
              <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, data?.total)} of {data?.total} subjects
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', filters.page + 1)}
                  disabled={filters.page * filters.limit >= data?.total}
                  className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject Form Dialog */}
      <SubjectForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingSubject}
        classes={classes}
      />
    </div>
  );
}