// components/class/ClassList.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Edit, Trash2, Plus, Users, BookOpen, Eye, Calendar } from "lucide-react";
import {
  useGetClassesQuery,
  useDeleteClassMutation,
  useGetClassesWithoutSupervisorQuery
} from "@/features/apis/classesApi";
import { useGetSectionsQuery } from "@/features/apis/sectionsApi";
import ClassForm from "./ClassForm";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ClassList({ teachers = [], subjects = [] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    academicYear: "",
    section: "",
    supervisor: "",
    page: 1,
    limit: 20
  });
  const navigate = useNavigate();

  // Get current year for academic year filter
  const currentYear = new Date().getFullYear();
  const academicYearOptions = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const { data, isLoading, refetch } = useGetClassesQuery(filters);
  const { data: sectionsData } = useGetSectionsQuery();
  const { data: classesWithoutSupervisor } = useGetClassesWithoutSupervisorQuery();

  const sections = sectionsData?.sections || [];
  const classes = data?.classes || [];
  const statistics = data?.statistics || {};
  const [deleteClass] = useDeleteClassMutation();

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this class? This will remove all class associations but keep students and teachers.")) return;
    try {
      await deleteClass(id).unwrap();
      refetch();
      toast.success("Class deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete class");
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingClass(null);
    refetch();
  };

  const handleViewDetails = (classId) => {
    navigate(`/admin/classes/${classId}`);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      academicYear: "",
      section: "",
      supervisor: "",
      page: 1,
      limit: 20
    });
  };

  const hasActiveFilters = filters.search || filters.academicYear || filters.section || filters.supervisor;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading classes...</div>
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
              <CardTitle className="text-2xl">Class Management</CardTitle>
              <CardDescription>
                {statistics.totalClasses} total classes, {statistics.activeClasses} active this academic year
              </CardDescription>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Class
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Total Classes</div>
              <div className="text-2xl font-bold">{statistics.totalClasses || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">With Supervisor</div>
              <div className="text-2xl font-bold">{statistics.classesWithSupervisor || 0}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Supervisor Coverage</div>
              <div className="text-2xl font-bold">{statistics.supervisorCoverage || 0}%</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Without Supervisor</div>
              <div className="text-2xl font-bold">{classesWithoutSupervisor?.count || 0}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search classes..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Academic Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={filters.academicYear ?? "all"}
                onValueChange={(value) => updateFilter('academicYear', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYearOptions.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={filters.section ?? "all"}
                onValueChange={(value) => updateFilter('section', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(section => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.name} ({section.currentStrength}/{section.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supervisor Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor</label>
              <Select value={filters.supervisor??"all"} 
              onValueChange={(value) => updateFilter('supervisor', value=="all"? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All supervisors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="has">Has Supervisor</SelectItem>
                  <SelectItem value="none">No Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No classes match your filters" : "No classes found. Create your first class to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((classItem) => (
                  <TableRow key={classItem._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">{classItem.name}</div>
                          <div className="text-xs text-gray-500">
                            ID: {classItem._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {classItem?.section?.name || 'N/A'}
                        </Badge>
                        {classItem?.section?.currentStrength && (
                          <span className="text-xs text-gray-500">
                            ({classItem.section.currentStrength}/{classItem.section.capacity})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{classItem.academicYear}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {classItem.supervisor ? (
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-[150px]">
                            {classItem?.supervisor?.user?.name}
                          </div>
                          <div className="text-gray-500 truncate max-w-[150px]">
                            {classItem?.supervisor?.user?.email}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          Needs Supervisor
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{classItem.students?.length || 0}</span>
                        {classItem.students?.length > 0 && (
                          <span className="text-xs text-gray-500">
                            ({classItem.students.filter(s => s.gender === 'male').length}M/{classItem.students.filter(s => s.gender === 'female').length}F)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span>{classItem.subjects?.length || 0}</span>
                        {classItem.subjects?.length > 0 && (
                          <div className="flex -space-x-1">
                            {classItem.subjects.slice(0, 3).map((subject, idx) => (
                              <div
                                key={subject._id}
                                className="w-6 h-6 bg-blue-100 border border-white rounded-full flex items-center justify-center text-xs"
                                title={subject.name}
                              >
                                {subject.code?.[0] || subject.name?.[0]}
                              </div>
                            ))}
                            {classItem.subjects.length > 3 && (
                              <div className="w-6 h-6 bg-gray-100 border border-white rounded-full flex items-center justify-center text-xs">
                                +{classItem.subjects.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(classItem._id)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(classItem)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(classItem._id)}
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
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, data?.total)} of {data?.total} classes
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

      {/* Class Form Dialog */}
      <ClassForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingClass}
        teachers={teachers}
        subjects={subjects}
        sections={sections}
      />
    </div>
  );
}

// // components/classes/ClassList.jsx
// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Edit, Trash2, Plus, Users, BookOpen, Eye } from "lucide-react";
// import { useGetClassesQuery, useDeleteClassMutation } from "@/features/apis/classesApi";
// import ClassForm from "./ClassForm";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { useGetSectionsQuery } from "@/features/apis/sectionsApi";

// export default function ClassList({ teachers = [], subjects = [] }) {
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [editingClass, setEditingClass] = useState(null);
//   const navigate = useNavigate();

//   const { data, isLoading, refetch } = useGetClassesQuery();
//   const classes = data?.classes || [];

//   // Inside component
//   const { data: sectionsData } = useGetSectionsQuery();
//   const sections = sectionsData?.sections || [];

//   const [deleteClass] = useDeleteClassMutation();

//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure you want to delete this class?")) return;
//     try {
//       await deleteClass(id).unwrap();
//       refetch();
//     } catch (err) {
//       toast.error(err?.data?.message || "Failed to delete class");
//     }
//   };

//   const handleEdit = (classItem) => {
//     setEditingClass(classItem);
//     setIsFormOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingClass(null);
//     setIsFormOpen(true);
//   };

//   const handleFormClose = () => {
//     setIsFormOpen(false);
//     setEditingClass(null);
//     refetch();
//   };

//   const handleViewDetails = (classId) => {
//     navigate(`/admin/classes/${classId}`);
//   };

//   if (isLoading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="text-center">Loading classes...</div>
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
//             <CardTitle className="text-2xl">Class Management</CardTitle>
//             <Button onClick={handleAddNew} className="flex items-center gap-2">
//               <Plus className="w-4 h-4" />
//               Add Class
//             </Button>
//           </div>
//         </CardHeader>
//       </Card>

//       {/* Classes Table */}
//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Class Name</TableHead>
//                 <TableHead>Section</TableHead>
//                 <TableHead>Supervisor</TableHead>
//                 <TableHead>Students</TableHead>
//                 <TableHead>Subjects</TableHead>
//                 <TableHead className="text-right">Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {classes.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-8 text-gray-500">
//                     No classes found. Create your first class to get started.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 classes.map((classItem) => (
//                   <TableRow key={classItem._id}>
//                     <TableCell className="font-medium">
//                       <div className="flex items-center gap-2">
//                         <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
//                         {classItem.name}
//                       </div>
//                     </TableCell>

//                     <TableCell className="font-medium">
//                       <div className="flex items-center gap-2">
//                         {classItem?.section?.name}
//                       </div>
//                     </TableCell>

//                     <TableCell>
//                       {classItem.supervisor ? (
//                         <div className="text-sm">
//                           <div className="font-medium">{classItem?.supervisor?.user?.name}</div>
//                           <div className="text-gray-500">{classItem?.supervisor?.user?.email}</div>
//                         </div>
//                       ) : (
//                         <Badge variant="outline" className="text-gray-500">
//                           No Supervisor
//                         </Badge>
//                       )}
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Users className="w-4 h-4 text-gray-500" />
//                         <span>{classItem.students?.length || 0} students</span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <BookOpen className="w-4 h-4 text-gray-500" />
//                         <span>{classItem.subjects?.length || 0} subjects</span>
//                       </div>
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-2">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleViewDetails(classItem._id)}
//                           className="flex items-center gap-1"
//                         >
//                           <Eye className="w-3 h-3" />
//                           View
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleEdit(classItem)}
//                           className="flex items-center gap-1"
//                         >
//                           <Edit className="w-3 h-3" />
//                           Edit
//                         </Button>
//                         <Button
//                           variant="destructive"
//                           size="sm"
//                           onClick={() => handleDelete(classItem._id)}
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

//       {/* Class Form Dialog */}
//       <ClassForm
//         open={isFormOpen}
//         onOpenChange={handleFormClose}
//         initialData={editingClass}
//         teachers={teachers}
//         subjects={subjects}
//         sections={sections}
//       />
//     </div>
//   );
// }