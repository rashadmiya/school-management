import React, { useState } from "react";
import { 
  useGetStudentsQuery, 
  useDeleteStudentMutation,
  useUploadStudentPhotoMutation,
} from "@/features/apis/studentsApi";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  BookOpen, 
  Download,
  Camera,
  Filter,
  X
} from "lucide-react";
import { toast } from "react-toastify";
import StudentDialogForm from "@/components/student/StudentDialogForm";
import StudentSearchBar from "@/components/student/StudentSearchBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend_url } from "@/utils/server";

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({});
  const [photoUploadFor, setPhotoUploadFor] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const { 
    data, 
    isLoading, 
    refetch 
  } = useGetStudentsQuery({ 
    page, 
    limit: 20,
    ...searchParams 
  });
  
  const [deleteStudent] = useDeleteStudentMutation();
  const [uploadStudentPhoto] = useUploadStudentPhotoMutation();
  const [editingStudent, setEditingStudent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: classData } = useGetClassesQuery();
  const classes = classData?.classes || [];

  const students = data?.docs || data?.students || [];

  // console.log("students :", students)
  // Get unique sessions from students for filter dropdown
  const sessions = [...new Set(students.map(s => s.session).filter(Boolean))];

  // Handle search from SearchBar
  const handleSearch = (searchFilters) => {
    setSearchParams(searchFilters);
    setPage(1);
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    toast.info("Export feature coming soon!");
  };

  // Handle photo file selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image (JPEG, PNG, WebP)");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!photoFile || !photoUploadFor) return;
        console.log("handle photo upload :", photoFile)
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      
      await uploadStudentPhoto({ id: photoUploadFor, formData }).unwrap();
      toast.success("Photo uploaded successfully");
      refetch();
      resetPhotoUpload();
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error(error?.data?.message || "Failed to upload photo");
    }
  };

  // Reset photo upload state
  const resetPhotoUpload = () => {
    setPhotoUploadFor(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('photo-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (id, studentName) => {
    if (!confirm(`Are you sure you want to delete ${studentName}?`)) return;
    try {
      await deleteStudent(id).unwrap();
      toast.success("Student deleted successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete student");
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsDialogOpen(true);
  };

  const handleSaved = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    refetch();
    toast.success(editingStudent ? "Student updated successfully" : "Student created successfully");
  };

  const handleDialogOpenChange = (open) => {
    if (!open) {
      setEditingStudent(null);
    }
    setIsDialogOpen(open);
  };

  // Photo upload modal
  const renderPhotoUploadModal = () => {
    if (!photoUploadFor) return null;
    
    const student = students.find(s => s._id === photoUploadFor);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Student Photo
            </CardTitle>
            <CardDescription>
              Upload photo for {student?.name || 'Student'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {/* Photo Preview */}
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {student?.photoUrl && !photoPreview && (
                  <img
                    src={`${backend_url}${student.photoUrl}`}
                    alt={student.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';

                      const fallback = e.target.nextElementSibling;
                      if (fallback && fallback.style) {
                        fallback.style.display = 'flex';
                      }
                    }}

                  />
                )}
              </div>

              {/* File Input */}
              <div className="w-full space-y-2">
                <Label htmlFor="photo-file-input">Choose a photo</Label>
                <Input
                  id="photo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 text-center">
                  Supported formats: JPG, PNG, WebP. Max size: 5MB
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetPhotoUpload}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhotoUpload}
                disabled={!photoFile}
                className="flex-1"
              >
                {photoFile ? "Upload Photo" : "Select Photo First"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: "photo",
      title: "",
      width: "70px",
      render: (row) => (
        <div className="relative">
          {row.photo ? (
            <img
              src={`${backend_url}${row.photo}`}
              alt={row.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || '')}&background=random`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <button
            onClick={() => setPhotoUploadFor(row._id)}
            className={`absolute -bottom-1 -right-1 rounded-full p-1 hover:scale-110 transition-transform ${
              row.photo 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title={row.photo ? "Change photo" : "Add photo"}
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
      )
    },
    {
      key: "rollNumber",
      title: "Roll No.",
      render: (row) => (
        <Badge variant="outline" className="font-mono">
          {row.rollNumber}
        </Badge>
      )
    },
    {
      key: "studentInfo",
      title: "Student Information",
      render: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{row.name}</p>
            {row.gender && (
              <Badge variant="secondary" className="text-xs capitalize">
                {row.gender}
              </Badge>
            )}
            {row.isPhysicallyDisabled && (
              <Badge variant="destructive" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {row.guardianContact && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{row.guardianContact}</span>
              </div>
            )}
            {row.fathersName && (
              <span className="truncate" title={`Father: ${row.fathersName}`}>
                Father: {row.fathersName}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: "session",
      title: "Session",
      render: (row) => (
        row.session ? (
          <Badge variant="outline" className="text-xs">
            {row.session}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        )
      )
    },
    {
      key: "religion",
      title: "Religion",
      render: (row) => (
        row.religion ? (
          <Badge variant="outline" className="text-xs capitalize">
            {row.religion}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      )
    },
    {
      key: "class",
      title: "Class",
      render: (row) => (
        row.class ? (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{row.class.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No Class</span>
        )
      )
    },
    {
      key: "parent",
      title: "Parent",
      render: (row) => (
        row.parent ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-sm font-medium truncate">{row.parent.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {row.parent.phone && (
                <span className="truncate">{row.parent.phone}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No Parent</span>
        )
      )
    },
    {
      key: "actions",
      title: "Actions",
      width: "140px",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row._id, row.name)}
            className="h-8 w-8 p-0"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhotoUploadFor(row._id)}
            className="h-8 w-8 p-0"
            title={row.photoUrl ? "Change photo" : "Add photo"}
          >
            <Camera className="w-3 h-3" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students Management</h1>
          <p className="text-gray-600 mt-2">
            Manage student records with photo uploads
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={handleAddNew}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search Bar Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search & Filter Students</CardTitle>
          <CardDescription>
            Use basic search or advanced filters to find students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentSearchBar
            onSearch={handleSearch}
            classes={classes}
            sessions={sessions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(students.map(s => s.class?.name).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-600">Active Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(students.map(s => s.parent?._id).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-600">Parents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Camera className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {students.filter(s => s.photoUrl).length}
                </p>
                <p className="text-sm text-gray-600">With Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Student Records</CardTitle>
              <CardDescription>
                {data?.total || 0} students found • Page {page} of {data?.pages || 1}
                {data?.statistics?.photoCoverage && (
                  <span className="ml-2 text-green-600">
                    • {data.statistics.photoCoverage}% have photos
                  </span>
                )}
              </CardDescription>
            </div>
            
            {Object.keys(searchParams).length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {Object.keys(searchParams).length} active filters
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSearch({})}
                  className="h-6 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading students...</p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm mt-1">
                {Object.keys(searchParams).length > 0 
                  ? "Try adjusting your search filters" 
                  : "Get started by adding your first student"}
              </p>
              <Button onClick={handleAddNew} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Student
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead 
                          key={column.key} 
                          className={column.width ? `w-[${column.width}]` : ''}
                        >
                          {column.title}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id} className="hover:bg-gray-50/50">
                        {columns.map((column) => (
                          <TableCell key={`${student._id}-${column.key}`}>
                            {column.render ? column.render(student) : student[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {students.length} of {data?.total || 0} students
                  {data?.statistics && (
                    <span className="ml-2">
                      • {data.statistics.withPhoto} with photos
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!data?.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Student Dialog Form */}
      <StudentDialogForm
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        initialData={editingStudent}
        onSaved={handleSaved}
        classes={classes}
      />

      {/* Photo Upload Modal */}
      {renderPhotoUploadModal()}
    </div>
  );
}
// import React, { useState } from "react";
// import { useGetStudentsQuery, useDeleteStudentMutation } from "@/features/apis/studentsApi";
// import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Edit, Trash2, Plus, User, Phone, Mail, BookOpen, Download } from "lucide-react";
// import { toast } from "react-toastify";
// import StudentDialogForm from "@/components/student/StudentDialogForm";
// import StudentSearchBar from "@/components/student/StudentSearchBar";

// export default function StudentsPage() {
//   const [page, setPage] = useState(1);
//   const [searchParams, setSearchParams] = useState({}); // State for search parameters
  
//   // Update the query to include searchParams
//   const { data, isLoading, refetch } = useGetStudentsQuery({ 
//     page, 
//     limit: 20,
//     ...searchParams // Add search parameters to the query
//   });
  
//   const [deleteStudent] = useDeleteStudentMutation();
//   const [editingStudent, setEditingStudent] = useState(null);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   const { data: classData } = useGetClassesQuery();
//   const classes = classData?.classes || [];

//   const students = data?.students || data?.docs || [];

//   // Get unique sessions from students for filter dropdown
//   const sessions = [...new Set(students.map(s => s.session).filter(Boolean))];

//   // Handle search from SearchBar
//   const handleSearch = (searchFilters) => {
//     setSearchParams(searchFilters);
//     setPage(1); // Reset to first page on new search
//   };

//   // Handle export to CSV (optional feature)
//   const handleExportCSV = () => {
//     // Implementation for CSV export
//     toast.info("Export feature coming soon!");
//   };

//   const handleDelete = async (id, studentName) => {
//     if (!confirm(`Are you sure you want to delete ${studentName}?`)) return;
//     try {
//       await deleteStudent(id).unwrap();
//       toast.success("Student deleted successfully");
//       refetch();
//     } catch (err) {
//       toast.error(err?.data?.message || "Failed to delete student");
//     }
//   };

//   const handleEdit = (student) => {
//     setEditingStudent(student);
//     setIsDialogOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingStudent(null);
//     setIsDialogOpen(true);
//   };

//   const handleSaved = () => {
//     setIsDialogOpen(false);
//     setEditingStudent(null);
//     refetch();
//     toast.success(editingStudent ? "Student updated successfully" : "Student created successfully");
//   };

//   const handleDialogOpenChange = (open) => {
//     if (!open) {
//       setEditingStudent(null);
//     }
//     setIsDialogOpen(open);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold">Students Management</h1>
//           <p className="text-gray-600 mt-2">
//             Manage student records, search by religion, session, and other filters
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             onClick={handleExportCSV}
//             className="flex items-center gap-2"
//           >
//             <Download className="w-4 h-4" />
//             Export
//           </Button>
//           <Button
//             onClick={handleAddNew}
//             className="flex items-center gap-2"
//           >
//             <Plus className="w-4 h-4" />
//             Add Student
//           </Button>
//         </div>
//       </div>

//       {/* Search Bar Section */}
//       <Card>
//         <CardHeader className="pb-3">
//           <CardTitle className="text-lg">Search & Filter Students</CardTitle>
//           <CardDescription>
//             Use basic search or advanced filters to find students
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <StudentSearchBar
//             onSearch={handleSearch}
//             classes={classes}
//             sessions={sessions}
//             isLoading={isLoading}
//           />
//         </CardContent>
//       </Card>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <User className="w-5 h-5 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{students.length}</p>
//                 <p className="text-sm text-gray-600">Total Students</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-green-100 rounded-lg">
//                 <BookOpen className="w-5 h-5 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">
//                   {new Set(students.map(s => s.class?.name).filter(Boolean)).size}
//                 </p>
//                 <p className="text-sm text-gray-600">Active Classes</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-purple-100 rounded-lg">
//                 <User className="w-5 h-5 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">
//                   {new Set(students.map(s => s.parent?._id).filter(Boolean)).size}
//                 </p>
//                 <p className="text-sm text-gray-600">Parents</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Updated: Show guardian contact count */}
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-orange-100 rounded-lg">
//                 <Phone className="w-5 h-5 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">
//                   {students.filter(s => s.guardianContact).length}
//                 </p>
//                 <p className="text-sm text-gray-600">With Contact</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Students Table */}
//       <Card>
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <div>
//               <CardTitle>Student Records</CardTitle>
//               <CardDescription>
//                 {data?.total || 0} students found • Page {page} of {data?.pages || 1}
//               </CardDescription>
//             </div>
            
//             {/* Show active filters */}
//             {Object.keys(searchParams).length > 0 && (
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-500">Active filters:</span>
//                 <Badge variant="outline" className="text-xs">
//                   {Object.keys(searchParams).length} active
//                 </Badge>
//                 <Button 
//                   variant="ghost" 
//                   size="sm" 
//                   onClick={() => handleSearch({})}
//                   className="h-6 text-xs"
//                 >
//                   Clear All
//                 </Button>
//               </div>
//             )}
//           </div>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="flex items-center justify-center py-8">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                 <p className="mt-2 text-gray-600">Loading students...</p>
//               </div>
//             </div>
//           ) : students.length === 0 ? (
//             <div className="text-center py-8 text-gray-500">
//               <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//               <p className="text-lg font-medium">No students found</p>
//               <p className="text-sm mt-1">
//                 {Object.keys(searchParams).length > 0 
//                   ? "Try adjusting your search filters" 
//                   : "Get started by adding your first student"}
//               </p>
//               <Button onClick={handleAddNew} className="mt-4">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add First Student
//               </Button>
//             </div>
//           ) : (
//             <>
//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-20">Roll No.</TableHead>
//                       <TableHead>Student Information</TableHead>
//                       <TableHead className="w-24">Session</TableHead>
//                       <TableHead className="w-28">Religion</TableHead>
//                       <TableHead>Class</TableHead>
//                       <TableHead>Parent</TableHead>
//                       <TableHead className="w-32">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {students.map((student) => (
//                       <TableRow key={student._id} className="hover:bg-gray-50">
//                         {/* Roll Number */}
//                         <TableCell>
//                           <Badge variant="outline" className="font-mono">
//                             {student.rollNumber}
//                           </Badge>
//                         </TableCell>

//                         {/* Student Information - Updated */}
//                         <TableCell>
//                           <div className="flex items-center gap-3">
//                             <div className="flex-shrink-0">
//                               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                                 <User className="w-4 h-4 text-blue-600" />
//                               </div>
//                             </div>
//                             <div className="min-w-0 flex-1">
//                               <div className="flex items-center justify-evenly gap-3">
//                                 <p className="font-medium text-sm truncate">
//                                   {student.name}
//                                 </p>
//                                 {student.gender && (
//                                   <Badge variant="secondary" className="text-xs capitalize text-center">
//                                     {student.gender}
//                                   </Badge>
//                                 )}
//                                 {student.isPhysicallyDisabled && (
//                                   <Badge variant="destructive" className="text-xs">
//                                     Disabled
//                                   </Badge>
//                                 )}
//                               </div>
//                               <div className="flex items-center justify-evenly gap-3 mt-1 text-xs text-gray-500">
//                                 {student.guardianContact && (
//                                   <div className="flex items-center gap-1">
//                                     <Phone className="w-3 h-3" />
//                                     <span>{student.guardianContact}</span>
//                                   </div>
//                                 )}
//                                 {student.fathersName && (
//                                   <span>Father: {student.fathersName}</span>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         </TableCell>

//                         {/* Session */}
//                         <TableCell>
//                           {student.session ? (
//                             <Badge variant="outline" className="text-xs">
//                               {student.session}
//                             </Badge>
//                           ) : (
//                             <span className="text-sm text-gray-400">N/A</span>
//                           )}
//                         </TableCell>

//                         {/* Religion */}
//                         <TableCell>
//                           {student.religion ? (
//                             <Badge variant="outline" className="text-xs capitalize">
//                               {student.religion}
//                             </Badge>
//                           ) : (
//                             <span className="text-sm text-gray-400">-</span>
//                           )}
//                         </TableCell>

//                         {/* Class */}
//                         <TableCell>
//                           {student.class ? (
//                             <div className="flex items-center gap-2">
//                               <BookOpen className="w-4 h-4 text-gray-400" />
//                               <span className="text-sm">{student.class.name}</span>
//                             </div>
//                           ) : (
//                             <span className="text-sm text-gray-400">No Class</span>
//                           )}
//                         </TableCell>

//                         {/* Parent */}
//                         <TableCell>
//                           {student.parent ? (
//                             <div className="space-y-1">
//                               <div className="flex items-center gap-2">
//                                 <User className="w-3 h-3 text-gray-400" />
//                                 <span className="text-sm font-medium">{student.parent.name}</span>
//                               </div>
//                               <div className="flex items-center gap-2 text-xs text-gray-500">
//                                 {student.parent.phone && (
//                                   <span>{student.parent.phone}</span>
//                                 )}
//                                 {student.parent.email && (
//                                   <span className="flex items-center gap-1">
//                                     <Mail className="w-3 h-3" />
//                                     {student.parent.email}
//                                   </span>
//                                 )}
//                               </div>
//                             </div>
//                           ) : (
//                             <span className="text-sm text-gray-400">No Parent</span>
//                           )}
//                         </TableCell>

//                         {/* Actions */}
//                         <TableCell>
//                           <div className="flex gap-2 text-center">
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={() => handleEdit(student)}
//                               className="h-8 w-8 p-0"
//                             >
//                               <Edit className="w-3 h-3" />
//                             </Button>
//                             <Button
//                               variant="destructive"
//                               size="sm"
//                               onClick={() => handleDelete(student._id, student.name)}
//                               className="h-8 w-8 p-0"
//                             >
//                               <Trash2 className="w-3 h-3" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>

//               {/* Pagination */}
//               <div className="flex items-center justify-between mt-4">
//                 <div className="text-sm text-gray-500">
//                   Showing {students.length} of {data?.total || 0} students
//                 </div>
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setPage(page - 1)}
//                     disabled={page === 1}
//                   >
//                     Previous
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => setPage(page + 1)}
//                     disabled={!data?.hasNextPage}
//                   >
//                     Next
//                   </Button>
//                 </div>
//               </div>
//             </>
//           )}
//         </CardContent>
//       </Card>

//       {/* Student Dialog Form */}
//       <StudentDialogForm
//         open={isDialogOpen}
//         onOpenChange={handleDialogOpenChange}
//         initialData={editingStudent}
//         onSaved={handleSaved}
//         classes={classes}
//       />
//     </div>
//   );
// }