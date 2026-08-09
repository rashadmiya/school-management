import DataTable from "@/components/common/DataTable";
import TeacherDialogForm from "@/components/teacher/TeacherForm";
import TeacherSearchBar from "@/components/teacher/TeacherSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadTeacherPhotoMutation } from "@/features/apis/api";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import {
  useDeleteTeacherMutation,
  useGetTeachersQuery,
} from "@/features/apis/teachersApi";
import { useAppSelector } from "@/features/store";
import { handleApiError } from "@/utils/handleApiErrors";
import { backend_url } from "@/utils/server";
import {
  Camera,
  Download,
  Edit,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
  Users,
  GraduationCap,
  Image,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function TeachersPage() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useState({});
  const {
    data,
    isLoading,
    isFetching,
    refetch
  } = useGetTeachersQuery({
    page,
    limit: 20,
    ...searchParams
  });

  const [deleteTeacher] = useDeleteTeacherMutation();
  const [uploadTeacherPhoto] = useUploadTeacherPhotoMutation();
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [photoUploadFor, setPhotoUploadFor] = useState(null);

  const { data: classData } = useGetClassesQuery();
  const classes = classData?.classes || [];

  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects = subjectsData?.subjects || [];

  // Get unique designations for filter
  const designations = [...new Set((data?.docs || []).map(t => t.designation).filter(Boolean))];

  const handleDelete = async (id, teacherName) => {
    if (!confirm(`Are you sure you want to delete ${teacherName}?`)) return;
    try {
      await deleteTeacher(id).unwrap();
      toast.success("Teacher deleted successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete teacher");
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setIsDialogOpen(true);
  };

  const handlePhotoUpload = async (teacherId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('photo', file);

      await uploadTeacherPhoto({ id: teacherId, formData }).unwrap();
      toast.success("Photo uploaded successfully");
      refetch();
      setPhotoUploadFor(null);
    } catch (error) {
      handleApiError(error, toast)
    }
  };

  const handleSaved = () => {
    setIsDialogOpen(false);
    setEditingTeacher(null);
    refetch();
    toast.success(editingTeacher ? "Teacher updated successfully" : "Teacher created successfully");
  };

  const handleDialogOpenChange = (open) => {
    if (!open) {
      setEditingTeacher(null);
    }
    setIsDialogOpen(open);
  };

  const handleSearch = (searchFilters) => {
    setSearchParams(searchFilters);
    setPage(1);
  };

  const handleExportCSV = () => {
    toast.info("Export feature coming soon!");
  };

  // Dynamic classes based on dark mode
  const theme = {
    background: isDarkMode ? "bg-gray-900" : "bg-white",
    backgroundSecondary: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    borderHover: isDarkMode ? "hover:border-gray-700" : "hover:border-gray-300",
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    cardBg: isDarkMode ? "bg-gray-900/50" : "bg-white",
    cardHover: isDarkMode ? "hover:border-gray-700" : "hover:shadow-md",
    inputBg: isDarkMode ? "bg-gray-800" : "bg-white",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-300",
    badge: {
      designation: isDarkMode 
        ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
        : "border-blue-200 text-blue-700 bg-blue-50",
      subject: isDarkMode
        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
        : "border-emerald-200 text-emerald-700 bg-emerald-50",
      religion: isDarkMode
        ? "bg-gray-800 text-gray-300 border-gray-700"
        : "bg-gray-100 text-gray-700 border-gray-200",
      filter: isDarkMode
        ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
        : "border-blue-200 text-blue-700 bg-blue-50",
    },
    button: {
      outline: isDarkMode
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
      primary: isDarkMode
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : "bg-blue-600 hover:bg-blue-700 text-white",
      ghost: isDarkMode
        ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
      action: {
        edit: isDarkMode
          ? "border-gray-700 text-gray-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10"
          : "border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50",
        delete: isDarkMode
          ? "border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10"
          : "border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50",
        photo: isDarkMode
          ? "border-gray-700 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10"
          : "border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50",
      }
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

  const columns = [
    {
      key: "photo",
      title: "",
      width: "60px",
      render: (row) => (
        <div className="relative group">
          {row.photo ? (
            <img
              src={`${backend_url}${row.photo}`}
              alt={row.user?.name}
              className={`w-10 h-10 rounded-full object-cover border-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || '')}&background=6366f1&color=fff&size=40`;
              }}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center border-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setPhotoUploadFor(row._id)}
            className={`absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100`}
            title="Upload photo"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
      )
    },
    {
      key: "user.name",
      title: "Teacher Information",
      render: (row) => (
        <div className="space-y-1">
          <div className={`font-semibold ${theme.textPrimary} flex items-center gap-2`}>
            {row.user?.name}
            {row.designation && (
              <Badge variant="outline" className={`text-xs ${theme.badge.designation}`}>
                {row.designation}
              </Badge>
            )}
          </div>
          <div className={`text-sm ${theme.textSecondary} flex items-center gap-2`}>
            <Mail className={`w-3 h-3 ${theme.textLight}`} />
            {row.user?.email}
          </div>
          {row.phoneNumber && (
            <div className={`text-sm ${theme.textSecondary} flex items-center gap-2`}>
              <Phone className={`w-3 h-3 ${theme.textLight}`} />
              {row.phoneNumber}
            </div>
          )}
          {row.joiningDate && (
            <div className={`text-xs ${theme.textMuted}`}>
              Joined: {new Date(row.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      )
    },
    {
      key: "details",
      title: "Details",
      render: (row) => (
        <div className="space-y-1">
          {row.religion && (
            <Badge variant="secondary" className={`text-xs capitalize ${theme.badge.religion}`}>
              {row.religion}
            </Badge>
          )}
          {row.lastQualification?.name && (
            <div className={`text-xs ${theme.textMuted} truncate`} title={row.lastQualification.name}>
              <span className={theme.textLight}>Qualification:</span> {row.lastQualification.name}
              {row.lastQualification.institute && ` (${row.lastQualification.institute})`}
            </div>
          )}
          {row.nationalIdNo && (
            <div className={`text-xs font-mono ${theme.textMuted}`}>
              NID: {row.nationalIdNo}
            </div>
          )}
          {row.gender && (
            <div className={`text-xs ${theme.textMuted} capitalize`}>
              Gender: {row.gender}
            </div>
          )}
        </div>
      )
    },
    {
      key: "subjects",
      title: "Subjects",
      render: (row) => (
        <div>
          {row.subjects?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.subjects.slice(0, 2).map((subject, index) => (
                <Badge key={subject._id || index} variant="outline" className={`text-xs ${theme.badge.subject}`}>
                  {subject.name}
                </Badge>
              ))}
              {row.subjects.length > 2 && (
                <Badge variant="outline" className={`text-xs ${isDarkMode ? "border-gray-700 text-gray-400 bg-gray-800" : "border-gray-200 text-gray-600 bg-gray-50"}`}>
                  +{row.subjects.length - 2} more
                </Badge>
              )}
            </div>
          ) : (
            <span className={`text-xs ${theme.textMuted}`}>No subjects assigned</span>
          )}
        </div>
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
            className={`h-8 w-8 p-0 ${theme.button.action.edit}`}
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row._id, row.user?.name)}
            className={`h-8 w-8 p-0 ${theme.button.action.delete}`}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPhotoUploadFor(row._id)}
            className={`h-8 w-8 p-0 ${theme.button.action.photo}`}
            title={row.photoUrl ? "Change photo" : "Add photo"}
          >
            <Camera className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Transform data
  const tableData = data?.docs || [];

  // Photo upload modal
  const renderPhotoUploadModal = () => {
    if (!photoUploadFor) return null;

    const teacher = tableData.find(t => t._id === photoUploadFor);

    return (
      <div className={`fixed inset-0 ${isDarkMode ? "bg-black/70" : "bg-black/50"} flex items-center justify-center z-50 p-4`}>
        <Card className={`w-96 ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} shadow-2xl`}>
          <CardHeader className={`border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"} pb-3`}>
            <div className="flex justify-between items-center">
              <CardTitle className={`text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Upload Photo
              </CardTitle>
              <button
                onClick={() => setPhotoUploadFor(null)}
                className={`${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
              {teacher?.user?.name}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`w-32 h-32 rounded-full ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"} flex items-center justify-center border-2 border-dashed`}>
                  {teacher?.photo ? (
                    <img
                      src={`${backend_url}${teacher.photo}`}
                      alt={teacher?.user?.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <User className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  )}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                id="photo-upload-input"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handlePhotoUpload(photoUploadFor, file);
                  }
                }}
                className="hidden"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className={`flex-1 ${isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => setPhotoUploadFor(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => document.getElementById('photo-upload-input')?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Choose Photo
                </Button>
              </div>
              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"} text-center`}>
                Supported formats: JPG, PNG, WebP. Max size: 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Teachers Management
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            Manage teacher records, assignments, and personal information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className={`flex items-center gap-2 ${isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-lg ${isDarkMode ? "" : "shadow-sm"}`}>
        <CardHeader className="pb-3">
          <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
            Search & Filter Teachers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherSearchBar
            onSearch={handleSearch}
            designations={designations}
            classes={classes}
            isLoading={isLoading || isFetching}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-lg ${isDarkMode ? "hover:border-gray-700" : "hover:shadow-md"} transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                <Users className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {data?.total || 0}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>
                  Total Teachers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-lg ${isDarkMode ? "hover:border-gray-700" : "hover:shadow-md"} transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-green-50 border-green-100"}`}>
                <GraduationCap className={`w-5 h-5 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {[...new Set(tableData.map(t => t.designation).filter(Boolean))].length}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>
                  Designations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-lg ${isDarkMode ? "hover:border-gray-700" : "hover:shadow-md"} transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-100"}`}>
                <Mail className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {tableData.filter(t => t.user?.email).length}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>
                  With Email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-lg ${isDarkMode ? "hover:border-gray-700" : "hover:shadow-md"} transition-all`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg border ${isDarkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100"}`}>
                <Image className={`w-5 h-5 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {tableData.filter(t => t.photoUrl).length}
                </p>
                <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>
                  With Photo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-lg ${isDarkMode ? "" : "shadow-sm"}`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                Teacher Records
              </CardTitle>
              <p className={isDarkMode ? "text-sm text-gray-400" : "text-sm text-gray-500"}>
                {data?.total || 0} teachers found • Page {page} of {data?.pages || 1}
              </p>
            </div>

            {Object.keys(searchParams).length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${theme.badge.filter}`}>
                  {Object.keys(searchParams).length} active {Object.keys(searchParams).length === 1 ? 'filter' : 'filters'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch({})}
                  className={`h-7 text-xs ${isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tableData}
            loading={isLoading || isFetching}
            pagination={
              data?.total ? {
                currentPage: page,
                totalPages: data.pages || Math.ceil(data.total / 20),
                onPageChange: setPage,
                totalItems: data.total
              } : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Teacher Dialog Form */}
      <TeacherDialogForm
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        initialData={editingTeacher}
        onSaved={handleSaved}
        classes={classes}
        subjects={subjects}
      />

      {/* Photo Upload Modal */}
      {renderPhotoUploadModal()}
    </div>
  );
}