import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/common/DataTable";
import TeacherDialogForm from "@/components/teacher/TeacherForm";
import {
  useDeleteTeacherMutation,
  useGetTeachersQuery,
} from "@/features/apis/teachersApi";
import {
  Edit,
  Trash2,
  Plus,
  Mail,
  Phone,
  User,
  Camera,
  Download,
  Filter
} from "lucide-react";
import { toast } from "react-toastify";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeacherSearchBar from "@/components/teacher/TeacherSearchBar";
import { useUploadTeacherPhotoMutation } from "@/features/apis/api";
import { backend_url } from "@/utils/server";
import { handleApiError } from "@/utils/handleApiErrors";

export default function TeachersPage() {
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

  const columns = [
    {
      key: "photo",
      title: "",
      width: "60px",
      render: (row) => (
        <div className="relative">
          {row.photo ? (
            <img
              // src={row.photo}
              src={`${backend_url}${row.photo}`}
              alt={row.user?.name}
              className="w-10 h-10 rounded-full object-cover border"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || '')}&background=random`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          {!row.photo && (
            <button
              onClick={() => setPhotoUploadFor(row._id)}
              className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
              title="Upload photo"
            >
              <Camera className="w-3 h-3" />
            </button>
          )}
        </div>
      )
    },
    {
      key: "user.name",
      title: "Teacher Information",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-semibold flex items-center gap-2">
            {row.user?.name}
            {row.designation && (
              <Badge variant="outline" className="text-xs">
                {row.designation}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Mail className="w-3 h-3" />
            {row.user?.email}
          </div>
          {row.phoneNumber && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {row.phoneNumber}
            </div>
          )}
          {row.joiningDate && (
            <div className="text-xs text-gray-500">
              Joined: {new Date(row.joiningDate).toLocaleDateString()}
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
            <Badge variant="secondary" className="text-xs capitalize">
              {row.religion}
            </Badge>
          )}
          {row.lastQualification?.name && (
            <div className="text-xs text-gray-600 truncate" title={row.lastQualification.name}>
              {row.lastQualification.name}
              {row.lastQualification.institute && ` (${row.lastQualification.institute})`}
            </div>
          )}
          {row.nationalIdNo && (
            <div className="text-xs font-mono text-gray-500">
              NID: {row.nationalIdNo}
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
                <Badge key={subject._id || index} variant="outline" className="text-xs">
                  {subject.name}
                </Badge>
              ))}
              {row.subjects.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{row.subjects.length - 2} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">No subjects</span>
          )}
        </div>
      )
    },
    // {
    //   key: "action",
    //   title: "Actions",
    //   width: "180px",
    //   render: (row) => (
    //     <div className="flex flex-col gap-2">
    //       <div className="flex gap-2">
    //         <Button
    //           variant="outline"
    //           size="sm"
    //           onClick={() => handleEdit(row)}
    //           className="flex-1"
    //         >
    //           <Edit className="w-3 h-3 mr-1" />
    //           Edit
    //         </Button>
    //         <Button
    //           variant="destructive"
    //           size="sm"
    //           onClick={() => handleDelete(row._id, row.user?.name)}
    //           className="flex-1"
    //         >
    //           <Trash2 className="w-3 h-3 mr-1" />
    //           Delete
    //         </Button>
    //       </div>
    //       {!row.photoUrl && (
    //         <Button
    //           variant="ghost"
    //           size="sm"
    //           onClick={() => setPhotoUploadFor(row._id)}
    //           className="text-xs"
    //         >
    //           <Camera className="w-3 h-3 mr-1" />
    //           Add Photo
    //         </Button>
    //       )}
    //     </div>
    //   )
    // },
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
            // onClick={() => handleDelete(row._id, row.name)}
            onClick={() => handleDelete(row._id, row.user?.name)}
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

  // Transform data
  const tableData = data?.docs || [];

  // Photo upload modal
  const renderPhotoUploadModal = () => {
    if (!photoUploadFor) return null;

    const teacher = tableData.find(t => t._id === photoUploadFor);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Upload Photo for {teacher?.user?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handlePhotoUpload(photoUploadFor, file);
                  }
                }}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPhotoUploadFor(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                >
                  Choose Photo
                </Button>
              </div>
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
          <h1 className="text-3xl font-bold">Teachers Management</h1>
          <p className="text-gray-600 mt-2">
            Manage teacher records, assignments, and personal information
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
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Search & Filter Teachers</CardTitle>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tableData.length}</p>
                <p className="text-sm text-gray-600">Total Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Filter className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {[...new Set(tableData.map(t => t.designation).filter(Boolean))].length}
                </p>
                <p className="text-sm text-gray-600">Designations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tableData.filter(t => t.user?.email).length}
                </p>
                <p className="text-sm text-gray-600">With Email</p>
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
                  {tableData.filter(t => t.photoUrl).length}
                </p>
                <p className="text-sm text-gray-600">With Photo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Teacher Records</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {data?.total || 0} teachers found • Page {page} of {data?.pages || 1}
              </p>
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

// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import DataTable from "@/components/common/DataTable";
// import TeacherDialogForm from "@/components/teacher/TeacherForm";
// import { useDeleteTeacherMutation, useGetTeachersQuery } from "@/features/apis/teachersApi";
// import { Edit, Trash2, Plus, Mail, Phone } from "lucide-react";
// import { toast } from "react-toastify";
// import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { useGetSubjectQuery, useGetSubjectsQuery } from "@/features/apis/subjectsApi";

// export default function TeachersPage() {
//   const [page, setPage] = useState(1);
//   const { data, isLoading, isFetching, refetch } = useGetTeachersQuery({ page, limit: 20 });
//   const [deleteTeacher] = useDeleteTeacherMutation();
//   const [editingTeacher, setEditingTeacher] = useState(null);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   const { data: classData, isLoading: isClassLoading, } = useGetClassesQuery();
//   const classes = classData?.classes || [];
//   const { data: subjectsData, isLoading: isSubjectsLoading, } = useGetSubjectsQuery();
//   const subjects = subjectsData?.subjects || [];


//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure you want to delete this teacher?")) return;
//     try {
//       await deleteTeacher(id).unwrap();
//       refetch(); // Refresh the list
//       // Optional: Show success message
//     } catch (err) {
//       toast.error(err?.data?.message || "Failed to delete teacher");
//     }
//   };

//   const handleEdit = (teacher) => {
//     setEditingTeacher(teacher);
//     setIsDialogOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingTeacher(null);
//     setIsDialogOpen(true);
//   };

//   const handleSaved = () => {
//     setIsDialogOpen(false);
//     setEditingTeacher(null);
//     refetch(); // Refresh the list
//   };

//   const handleDialogOpenChange = (open) => {
//     if (!open) {
//       setEditingTeacher(null);
//     }
//     setIsDialogOpen(open);
//   };

//   const columns = [
//     {
//       key: "user.name",
//       title: "Name",
//       render: (row) => (
//         <div>
//           <div className="font-medium">{row.user?.name}</div>
//           {row.phone && (
//             <div className="flex items-center gap-1 text-sm text-gray-500">
//               <Phone className="w-3 h-3" />
//               {row.phone}
//             </div>
//           )}
//         </div>
//       )
//     },
//     {
//       key: "user.email",
//       title: "Email",
//       render: (row) => (
//         <div className="flex items-center gap-1">
//           <Mail className="w-4 h-4 text-gray-500" />
//           <span className="text-sm">{row.user?.email}</span>
//         </div>
//       )
//     },
//     {
//       key: "subjects",
//       title: "Subjects",
//       render: (row) => (
//         <div>
//           {row.subjects?.length > 0 ? (
//             <div className="flex flex-wrap gap-1">
//               {row.subjects.slice(0, 2).map((subject, index) => (
//                 <span
//                   key={subject._id || index}
//                   className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
//                 >
//                   {subject.name}
//                 </span>
//               ))}
//               {row.subjects.length > 2 && (
//                 <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
//                   +{row.subjects.length - 2} more
//                 </span>
//               )}
//             </div>
//           ) : (
//             <span className="text-gray-400 text-sm">No subjects</span>
//           )}
//         </div>
//       )
//     },
//     {
//       key: "classes",
//       title: "Classes",
//       render: (row) => (
//         <div>
//           {row.classes?.length > 0 ? (
//             <div className="flex flex-wrap gap-1">
//               {row.classes.slice(0, 2).map((classItem, index) => (
//                 <span
//                   key={classItem._id || index}
//                   className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
//                 >
//                   {classItem.name}
//                 </span>
//               ))}
//               {row.classes.length > 2 && (
//                 <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
//                   +{row.classes.length - 2} more
//                 </span>
//               )}
//             </div>
//           ) : (
//             <span className="text-gray-400 text-sm">No classes</span>
//           )}
//         </div>
//       )
//     },
//     {
//       key: "action",
//       title: "Actions",
//       render: (row) => (
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => handleEdit(row)}
//             className="flex items-center gap-1"
//           >
//             <Edit className="w-4 h-4" />
//             Edit
//           </Button>
//           <Button
//             variant="destructive"
//             size="sm"
//             onClick={() => handleDelete(row._id)}
//             className="flex items-center gap-1"
//           >
//             <Trash2 className="w-4 h-4" />
//             Delete
//           </Button>
//         </div>
//       )
//     }
//   ];

//   // Transform data to handle nested user structure
//   const tableData = data?.teachers || data?.docs || [];

//   return (
//     <div className="">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
//           <p className="text-gray-600 mt-1">
//             Manage teacher records and assignments
//           </p>
//         </div>
//         <Button
//           onClick={handleAddNew}
//           className="flex items-center gap-2"
//         >
//           <Plus className="w-4 h-4" />
//           Add Teacher
//         </Button>
//       </div>

//       <DataTable
//         columns={columns}
//         data={tableData}
//         loading={isLoading || isFetching}
//         pagination={
//           data?.pagination || data?.totalPages ? {
//             currentPage: page,
//             totalPages: data.totalPages || data.pagination?.totalPages,
//             onPageChange: setPage,
//             totalItems: data.total || data.pagination?.total
//           } : undefined
//         }
//       />

//       {/* Teacher Dialog Form */}
//       <TeacherDialogForm
//         initialData={editingTeacher}
//         triggerLabel={editingTeacher ? "Edit Teacher" : "Add Teacher"}
//         onSaved={handleSaved}
//         open={isDialogOpen}
//         onOpenChange={handleDialogOpenChange}
//         classes={classes}
//         subjects={subjects}
//       />
//     </div>
//   );
// }