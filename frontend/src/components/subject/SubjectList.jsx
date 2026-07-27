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

export default function SubjectList({ classes = [] }) {
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading subjects...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Subject Management</CardTitle>
              <CardDescription>
                {statistics.totalSubjects} total subjects, {statistics.withClasses} assigned to classes
              </CardDescription>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Total Subjects</div>
              <div className="text-2xl font-bold">{statistics.totalSubjects || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">With Classes</div>
              <div className="text-2xl font-bold">{statistics.withClasses || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Class Coverage</div>
              <div className="text-2xl font-bold">{statistics.classCoverage || 0}%</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Without Classes</div>
              <div className="text-2xl font-bold">{subjectsWithoutClasses?.count || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
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
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search subjects..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={filters.classId ?? "all"} 
              onValueChange={(value) => updateFilter('classId', value=="all"? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Has Classes Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Assignment</label>
              <Select value={filters.hasClasses ?? "all"} 
              onValueChange={(value) => updateFilter('hasClasses', value == "all"? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="true">With Classes</SelectItem>
                  <SelectItem value="false">Without Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center gap-1">
                    Subject Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Assigned Classes</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
                  <div className="flex items-center gap-1">
                    Created
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No subjects match your filters" : "No subjects found. Create your first subject to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          {subject.code && (
                            <div className="text-xs text-gray-500">
                              ID: {subject._id?.slice(-6)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {subject.code ? (
                        <Badge variant="outline" className="font-mono">
                          {subject.code}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {subject.classes?.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{subject.classes.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {subject.classes.slice(0, 3).map((cls) => (
                              <Badge key={cls._id} variant="secondary" className="text-xs">
                                {cls.name}
                              </Badge>
                            ))}
                            {subject.classes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{subject.classes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          No Classes
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {new Date(subject.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[200px]">
                      <div className="truncate">
                        {subject.description || (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(subject._id)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subject._id)}
                          className="flex items-center gap-1 h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Pagination */}
          {data?.total > filters.limit && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, data?.total)} of {data?.total} subjects
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', filters.page + 1)}
                  disabled={filters.page * filters.limit >= data?.total}
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

// // components/subjects/SubjectList.jsx
// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Edit, Trash2, Plus, Search, BookOpen } from "lucide-react";
// import { useGetSubjectsQuery, useDeleteSubjectMutation, useSearchSubjectsQuery } from "@/features/apis/subjectsApi";
// import SubjectForm from "./SubjectForm";
// import { toast } from "react-toastify";

// export default function SubjectList() {
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingSubject, setEditingSubject] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");

//   const { data, isLoading, refetch } = useGetSubjectsQuery();
//   const { data: searchData } = useSearchSubjectsQuery(searchTerm, {
//     skip: !searchTerm
//   });
  
//   const [deleteSubject] = useDeleteSubjectMutation();

//   // Use search results if available, otherwise use all subjects
//   const subjects = searchTerm ? (searchData?.subjects || []) : (data?.subjects || []);

//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure you want to delete this subject?")) return;
//     try {
//       await deleteSubject(id).unwrap();
//       refetch();
//     } catch (err) {
//       toast.error(err?.data?.message || "Failed to delete subject");
//     }
//   };

//   const handleEdit = (subject) => {
//     setEditingSubject(subject);
//     setIsFormOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingSubject(null);
//     setIsFormOpen(true);
//   };

//   const handleFormClose = () => {
//     setIsFormOpen(false);
//     setEditingSubject(null);
//     refetch();
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     setSearchTerm(searchQuery);
//   };

//   const clearSearch = () => {
//     setSearchQuery("");
//     setSearchTerm("");
//   };

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center">Loading subjects...</div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <CardTitle className="text-2xl">Subject Management</CardTitle>
//               <p className="text-gray-600 mt-1">
//                 Manage all subjects offered in the school
//               </p>
//             </div>
//             <Button onClick={handleAddNew} className="flex items-center gap-2">
//               <Plus className="w-4 h-4" />
//               Add Subject
//             </Button>
//           </div>
//         </CardHeader>
        
//         <CardContent>
//           {/* Search */}
//           <form onSubmit={handleSearch} className="flex gap-2">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <Input
//                 placeholder="Search subjects by name, code, or description..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <Button type="submit" variant="outline">
//               Search
//             </Button>
//             {searchTerm && (
//               <Button type="button" variant="outline" onClick={clearSearch}>
//                 Clear
//               </Button>
//             )}
//           </form>

//           {/* Search Results Info */}
//           {searchTerm && (
//             <div className="mt-3 p-3 bg-blue-50 rounded-md">
//               <p className="text-sm text-blue-700">
//                 Found {subjects.length} subject(s) matching "{searchTerm}"
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Subjects Table */}
//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Subject Name</TableHead>
//                 <TableHead>Code</TableHead>
//                 <TableHead>Description</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {subjects.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={4} className="text-center py-8 text-gray-500">
//                     {searchTerm ? (
//                       "No subjects found matching your search."
//                     ) : (
//                       <div className="flex flex-col items-center gap-2">
//                         <BookOpen className="w-12 h-12 text-gray-300" />
//                         <p>No subjects found.</p>
//                         <p className="text-sm">Create your first subject to get started.</p>
//                       </div>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 subjects.map((subject) => (
//                   <TableRow key={subject._id}>
//                     <TableCell className="font-medium">
//                       <div className="flex items-center gap-2">
//                         <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                         {subject.name}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       {subject.code ? (
//                         <Badge variant="secondary" className="font-mono">
//                           {subject.code}
//                         </Badge>
//                       ) : (
//                         <span className="text-gray-400">-</span>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       {subject.description ? (
//                         <p className="text-sm text-gray-600 line-clamp-2">
//                           {subject.description}
//                         </p>
//                       ) : (
//                         <span className="text-gray-400">No description</span>
//                       )}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleEdit(subject)}
//                           className="flex items-center gap-1"
//                         >
//                           <Edit className="w-3 h-3" />
//                           Edit
//                         </Button>
//                         <Button
//                           variant="destructive"
//                           size="sm"
//                           onClick={() => handleDelete(subject._id)}
//                           className="flex items-center gap-1"
//                         >
//                           <Trash2 className="w-3 h-3" />
//                           Delete
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Stats Card */}
//       {!searchTerm && (
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="p-3 bg-blue-100 rounded-lg">
//                   <BookOpen className="w-6 h-6 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Subjects</p>
//                   <p className="text-2xl font-bold">{data?.count || 0}</p>
//                 </div>
//               </div>
//               <Badge variant="outline" className="text-sm">
//                 All Active
//               </Badge>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Subject Form Dialog */}
//       <SubjectForm
//         open={isFormOpen}
//         onOpenChange={handleFormClose}
//         initialData={editingSubject}
//       />
//     </div>
//   );
// }