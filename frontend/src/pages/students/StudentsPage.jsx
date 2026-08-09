// pages/students/StudentsPage.jsx
import StudentDialogForm from "@/components/student/StudentDialogForm";
import StudentSearchBar from "@/components/student/StudentSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import {
  useDeleteStudentMutation,
  useGetStudentsQuery,
  useUploadStudentPhotoMutation,
} from "@/features/apis/studentsApi";
import { useAppSelector } from "@/features/store";
import { backend_url } from "@/utils/server";
import {
  BookOpen,
  Camera,
  Download,
  Edit,
  Phone,
  Plus,
  Trash2,
  User,
  X
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function StudentsPage() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
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

  // Get unique sessions from students for filter dropdown
  const sessions = [...new Set(students.map(s => s.session).filter(Boolean))];

  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50/50",
    bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    badge: {
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
      secondary: isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "",
      destructive: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "",
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
    }
  };

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
      <div className={`fixed inset-0 ${isDarkMode ? "bg-black/70" : "bg-black/50"} flex items-center justify-center z-50 p-4`}>
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} shadow-2xl`}>
          <CardHeader className={`${isDarkMode ? "border-gray-800" : "border-gray-100"} border-b pb-3`}>
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Camera className="w-5 h-5" />
              Upload Student Photo
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Upload photo for {student?.name || 'Student'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
                  <div className={`w-32 h-32 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-200"} flex items-center justify-center border-4 border-white shadow-lg`}>
                    <User className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
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
                <Label className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  Choose a photo
                </Label>
                <Input
                  id="photo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className={`cursor-pointer ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : ""}`}
                />
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} text-center`}>
                  Supported formats: JPG, PNG, WebP. Max size: 5MB
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className={`flex-1 ${isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}`}
                onClick={resetPhotoUpload}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhotoUpload}
                disabled={!photoFile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {photoFile ? "Upload Photo" : "Select Photo First"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Table columns with dark mode support
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
              className={`w-10 h-10 rounded-full object-cover border-2 ${isDarkMode ? "border-gray-700" : "border-white"} shadow-sm`}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || '')}&background=6366f1&color=fff&size=40`;
              }}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-200"} flex items-center justify-center border-2 ${isDarkMode ? "border-gray-700" : "border-white"} shadow-sm`}>
              <User className={`w-5 h-5 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`} />
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
        <Badge variant="outline" className={`font-mono ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
          {row.rollNumber}
        </Badge>
      )
    },
    {
      key: "studentInfo",
      title: "Student Information",
      render: (row) => (
        <div className="space-y-1">
          <div className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            <p className="font-medium text-sm">{row.name}</p>
            {row.gender && (
              <Badge variant="secondary" className={`text-xs capitalize ${isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : ""}`}>
                {row.gender}
              </Badge>
            )}
            {row.isPhysicallyDisabled && (
              <Badge variant="destructive" className={`text-xs ${isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}`}>
                Disabled
              </Badge>
            )}
          </div>
          <div className={`flex items-center gap-3 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
          <Badge variant="outline" className={`text-xs ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
            {row.session}
          </Badge>
        ) : (
          <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>N/A</span>
        )
      )
    },
    {
      key: "religion",
      title: "Religion",
      render: (row) => (
        row.religion ? (
          <Badge variant="outline" className={`text-xs capitalize ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
            {row.religion}
          </Badge>
        ) : (
          <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>-</span>
        )
      )
    },
    {
      key: "class",
      title: "Class",
      render: (row) => (
        row.class ? (
          <div className={`flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            <BookOpen className={`w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
            <span className="text-sm">{row.class.name}</span>
          </div>
        ) : (
          <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>No Class</span>
        )
      )
    },
    {
      key: "parent",
      title: "Parent",
      render: (row) => (
        row.parent ? (
          <div className="space-y-1">
            <div className={`flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              <User className={`w-3 h-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <span className="text-sm font-medium truncate">{row.parent.name}</span>
            </div>
            <div className={`flex items-center gap-2 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              {row.parent.phone && (
                <span className="truncate">{row.parent.phone}</span>
              )}
            </div>
          </div>
        ) : (
          <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>No Parent</span>
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
            className={`h-8 w-8 p-0 ${isDarkMode ? "border-gray-700 text-gray-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10" : ""}`}
            title="Edit"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row._id, row.name)}
            className={`h-8 w-8 p-0 ${isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" : ""}`}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhotoUploadFor(row._id)}
            className={`h-8 w-8 p-0 ${isDarkMode ? "text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10" : ""}`}
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
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Students Management
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Manage student records with photo uploads
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className={`flex items-center gap-2 ${isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}`}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search Bar Section */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader className="pb-3">
          <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
            Search & Filter Students
          </CardTitle>
          <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
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
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm hover:shadow-md transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                <User className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {students.length}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  Total Students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm hover:shadow-md transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-green-50 border-green-100"}`}>
                <BookOpen className={`w-5 h-5 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {new Set(students.map(s => s.class?.name).filter(Boolean)).size}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  Active Classes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm hover:shadow-md transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-100"}`}>
                <User className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {new Set(students.map(s => s.parent?._id).filter(Boolean)).size}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  Parents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm hover:shadow-md transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100"}`}>
                <Camera className={`w-5 h-5 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {students.filter(s => s.photoUrl).length}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-600"}>
                  With Photos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                Student Records
              </CardTitle>
              <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                {data?.total || 0} students found • Page {page} of {data?.pages || 1}
                {data?.statistics?.photoCoverage && (
                  <span className={`ml-2 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
                    • {data.statistics.photoCoverage}% have photos
                  </span>
                )}
              </CardDescription>
            </div>
            
            {Object.keys(searchParams).length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${isDarkMode ? "border-blue-500/30 text-blue-400 bg-blue-500/10" : ""}`}>
                  {Object.keys(searchParams).length} active filters
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSearch({})}
                  className={`h-6 text-xs ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : ""}`}
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
                <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${isDarkMode ? "border-blue-400" : "border-blue-600"} mx-auto`}></div>
                <p className={`mt-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading students...</p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              <User className={`w-16 h-16 ${isDarkMode ? "text-gray-700" : "text-gray-300"} mx-auto mb-4`} />
              <p className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>No students found</p>
              <p className="text-sm mt-1">
                {Object.keys(searchParams).length > 0 
                  ? "Try adjusting your search filters" 
                  : "Get started by adding your first student"}
              </p>
              <Button onClick={handleAddNew} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add First Student
              </Button>
            </div>
          ) : (
            <>
              <div className={`rounded-lg border overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <Table>
                  <TableHeader className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                    <TableRow className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                      {columns.map((column) => (
                        <TableHead 
                          key={column.key} 
                          className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} ${column.width ? `w-[${column.width}]` : ''}`}
                        >
                          {column.title}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow 
                        key={student._id} 
                        className={`${isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "hover:bg-gray-50/50"}`}
                      >
                        {columns.map((column) => (
                          <TableCell 
                            key={`${student._id}-${column.key}`}
                            className={isDarkMode ? "text-gray-300" : "text-gray-700"}
                          >
                            {column.render ? column.render(student) : student[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className={`flex flex-col sm:flex-row items-center justify-between mt-6 gap-3`}>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
                    className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!data?.hasNextPage}
                    className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : ""}
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