// pages/ExamRoutinePage.jsx - For Admin Management Only
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Calendar, Clock, Filter, Download, Users } from "lucide-react";
import { useGetExamRoutinesQuery, useDeleteExamRoutineMutation, usePublishExamRoutineMutation } from "@/features/apis/examRoutineApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ExamRoutineForm from "@/components/exam/ExamRoutineForm";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ExamRoutinePDF from "@/components/PDFExporters/ExamRoutinePDF";

export default function ExamRoutinePage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [filters, setFilters] = useState({
        examType: "",
        class: "",
        academicYear: "",
        isPublished: ""
    });
    
    const { data, isLoading, refetch } = useGetExamRoutinesQuery(filters);
    const [deleteExamRoutine] = useDeleteExamRoutineMutation();
    const [publishExamRoutine] = usePublishExamRoutineMutation();

    const exams = data?.examRoutines || [];

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this exam routine?")) return;
        try {
            await deleteExamRoutine(id).unwrap();
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to delete exam routine");
        }
    };

    const handleEdit = (exam) => {
        setEditingExam(exam);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingExam(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingExam(null);
        refetch();
    };

    const handlePublishToggle = async (exam) => {
        try {
            await publishExamRoutine({ 
                id: exam._id, 
                isPublished: !exam.isPublished 
            }).unwrap();
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update publish status");
        }
    };

    const getExamTypeColor = (type) => {
        const colors = {
            midterm: "bg-blue-100 text-blue-800",
            final: "bg-red-100 text-red-800",
            term: "bg-green-100 text-green-800",
            weekly: "bg-yellow-100 text-yellow-800",
            monthly: "bg-purple-100 text-purple-800",
            others: "bg-gray-100 text-gray-800"
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const clearFilters = () => {
        setFilters({
            examType: "",
            class: "",
            academicYear: "",
            isPublished: ""
        });
    };

    // const getUniqueValues = (key) => {
    //     const values = new Set(exams.map(exam => exam[key]));
    //     return Array.from(values).filter(Boolean);
    // };

    const getUniqueValues = (key) => {
    // Check if the key corresponds to a potentially nested object (like a class or subject)
    if (key === 'class' || key === 'subject') {
        // Map to the object's _id if it exists, otherwise use the value directly
        const values = new Set(exams.map(exam => exam[key]?._id || exam[key]));
        return Array.from(values).filter(Boolean);
    }

    const values = new Set(exams.map(exam => exam[key]));
    return Array.from(values).filter(Boolean);
};

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Loading exam routines...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="container space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Exam Routine Management</h1>
                    <p className="text-gray-600 mt-2">
                        Manage examination schedules and monitoring duties
                    </p>
                </div>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Exam
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Filters:</span>
                        </div>
                        
                        <Select onValueChange={(value) => updateFilter("examType", value)} value={filters.examType || "all"}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Exam Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {getUniqueValues("examType").map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => updateFilter("class", value)} value={filters.class || "all"}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {getUniqueValues("class").map(classId => {
                                    const exam = exams.find(e => e.class?._id === classId);
                                    return (
                                        <SelectItem key={classId} value={classId}>
                                            {exam?.class?.name || classId}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        <Select onValueChange={(value) => updateFilter("isPublished", value)} value={filters.isPublished || "all"}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="true">Published</SelectItem>
                                <SelectItem value="false">Draft</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Academic Year (e.g., 2024-2025)"
                            className="w-48"
                            value={filters.academicYear || ""}
                            onChange={(e) => updateFilter("academicYear", e.target.value)}
                        />

                        <Button variant="outline" onClick={clearFilters}>
                            Clear
                        </Button>

                        {exams.length > 0 && (
                            <PDFDownloadLink
                                document={<ExamRoutinePDF exams={exams} adminView={true} />}
                                fileName={`exam-routines-management-${new Date().getFullYear()}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button variant="outline" disabled={loading} className="flex items-center gap-2 ml-auto">
                                        <Download className="w-4 h-4" />
                                        {loading ? "Generating..." : "Export PDF"}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Exams Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Monitoring</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        No exam routines found. Create your first exam routine.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                exams.map((exam) => (
                                    <TableRow key={exam._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {exam.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getExamTypeColor(exam.examType)}>
                                                {exam.examType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{formatDate(exam.examDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{exam.startTime} - {exam.endTime}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {exam.class?.name} 
                                            {exam.class?.section?.name && ` (${exam.class.section.name})`}
                                        </TableCell>
                                        <TableCell>{exam.subject?.name}</TableCell>
                                        <TableCell>{exam.roomNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-gray-500" />
                                                <span>{exam.monitoringTeachers?.length || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={exam.isPublished}
                                                    onCheckedChange={() => handlePublishToggle(exam)}
                                                    size="sm"
                                                />
                                                <Badge variant={exam.isPublished ? "default" : "secondary"}>
                                                    {exam.isPublished ? "Published" : "Draft"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(exam)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(exam._id)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Stats Summary */}
            {exams.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600 font-medium">Total Exams</p>
                                <p className="text-2xl font-bold text-blue-700">{exams.length}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Published</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {exams.filter(e => e.isPublished).length}
                                </p>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <p className="text-sm text-yellow-600 font-medium">Drafts</p>
                                <p className="text-2xl font-bold text-yellow-700">
                                    {exams.filter(e => !e.isPublished).length}
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600 font-medium">Total Monitoring Duties</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {exams.reduce((sum, exam) => sum + (exam.monitoringTeachers?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <ExamRoutineForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                initialData={editingExam}
            />
        </div>
    );
}

// // pages/ExamRoutinesPage.jsx
// import React, { useState } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Plus, Eye, Calendar, Clock, BookOpen, Users, MapPin, Edit, Trash2 } from "lucide-react";
// import { useGetExamRoutinesQuery, useDeleteExamRoutineMutation } from "@/features/apis/examRoutineApi";
// import { useGetStudentExamsQuery } from "@/features/apis/examRoutineApi";
// import { useGetTeacherExamsQuery } from "@/features/apis/examRoutineApi";
// import ExamRoutineForm from "@/components/exam/ExamRoutineForm";
// import { toast } from "react-toastify";
// import { useAuth } from "@/hooks/useAuth";

// export default function ExamRoutinesPage() {
//     const { user } = useAuth();
//     const [isFormOpen, setIsFormOpen] = useState(false);
//     const [editingExam, setEditingExam] = useState(null);
//     const [activeTab, setActiveTab] = useState("manage");

//     const { data: allExamsData, isLoading: allLoading, refetch } = useGetExamRoutinesQuery();
//     const { data: studentExamsData, isLoading: studentLoading } = useGetStudentExamsQuery();
//     const { data: teacherExamsData, isLoading: teacherLoading } = useGetTeacherExamsQuery();
    
//     const [deleteExamRoutine] = useDeleteExamRoutineMutation();

//     const allExams = allExamsData?.examRoutines || [];
//     const studentExams = studentExamsData?.examRoutines || [];
//     const teacherExams = teacherExamsData?.examRoutines || [];

//     const handleDelete = async (id) => {
//         if (!confirm("Are you sure you want to delete this exam routine?")) return;
//         try {
//             await deleteExamRoutine(id).unwrap();
//             refetch();
//         } catch (err) {
//             toast.error(err?.data?.message || "Failed to delete exam routine");
//         }
//     };

//     const handleEdit = (exam) => {
//         setEditingExam(exam);
//         setIsFormOpen(true);
//     };

//     const handleAddNew = () => {
//         setEditingExam(null);
//         setIsFormOpen(true);
//     };

//     const handleFormClose = () => {
//         setIsFormOpen(false);
//         setEditingExam(null);
//         refetch();
//     };

//     const getExamTypeColor = (type) => {
//         const colors = {
//             midterm: "bg-blue-100 text-blue-800",
//             final: "bg-red-100 text-red-800",
//             term: "bg-green-100 text-green-800",
//             weekly: "bg-yellow-100 text-yellow-800",
//             monthly: "bg-purple-100 text-purple-800",
//             others: "bg-gray-100 text-gray-800"
//         };
//         return colors[type] || "bg-gray-100 text-gray-800";
//     };

//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-US', {
//             weekday: 'short',
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//         });
//     };

//     const isLoading = allLoading || studentLoading || teacherLoading;

//     if (isLoading) {
//         return (
//             <Card>
//                 <CardContent className="p-6">
//                     <div className="text-center">Loading exam routines...</div>
//                 </CardContent>
//             </Card>
//         );
//     }

//     return (
//         <div className="container space-y-6">
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h1 className="text-3xl font-bold">Exam Routine Management</h1>
//                     <p className="text-gray-600 mt-2">
//                         Schedule and manage examination routines for classes
//                     </p>
//                 </div>
//                 {(user?.role === 'admin' || user?.role === 'teacher') && (
//                     <Button onClick={handleAddNew} className="flex items-center gap-2">
//                         <Plus className="w-4 h-4" />
//                         Add Exam
//                     </Button>
//                 )}
//             </div>

//             <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//                 <TabsList>
//                     {(user?.role === 'admin' || user?.role === 'teacher') && (
//                         <TabsTrigger value="manage">Manage Exams</TabsTrigger>
//                     )}
//                     {user?.role === 'student' && (
//                         <TabsTrigger value="my-exams">My Exams</TabsTrigger>
//                     )}
//                     {(user?.role === 'teacher') && (
//                         <TabsTrigger value="monitoring">My Monitoring</TabsTrigger>
//                     )}
//                     <TabsTrigger value="calendar">Calendar View</TabsTrigger>
//                 </TabsList>

//                 {(user?.role === 'admin' || user?.role === 'teacher') && (
//                     <TabsContent value="manage">
//                         <Card>
//                             <CardContent className="p-0">
//                                 <Table>
//                                     <TableHeader>
//                                         <TableRow>
//                                             <TableHead>Exam Title</TableHead>
//                                             <TableHead>Type</TableHead>
//                                             <TableHead>Date & Time</TableHead>
//                                             <TableHead>Class</TableHead>
//                                             <TableHead>Subject</TableHead>
//                                             <TableHead>Room</TableHead>
//                                             <TableHead>Status</TableHead>
//                                             <TableHead className="text-right">Actions</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {allExams.length === 0 ? (
//                                             <TableRow>
//                                                 <TableCell colSpan={8} className="text-center py-8 text-gray-500">
//                                                     No exam routines found. Create your first exam routine.
//                                                 </TableCell>
//                                             </TableRow>
//                                         ) : (
//                                             allExams.map((exam) => (
//                                                 <TableRow key={exam._id}>
//                                                     <TableCell className="font-medium">{exam.title}</TableCell>
//                                                     <TableCell>
//                                                         <Badge variant="outline" className={getExamTypeColor(exam.examType)}>
//                                                             {exam.examType}
//                                                         </Badge>
//                                                     </TableCell>
//                                                     <TableCell>
//                                                         <div className="space-y-1">
//                                                             <div className="flex items-center gap-1">
//                                                                 <Calendar className="w-3 h-3" />
//                                                                 <span>{formatDate(exam.examDate)}</span>
//                                                             </div>
//                                                             <div className="flex items-center gap-1 text-sm text-gray-500">
//                                                                 <Clock className="w-3 h-3" />
//                                                                 <span>{exam.startTime} - {exam.endTime}</span>
//                                                             </div>
//                                                         </div>
//                                                     </TableCell>
//                                                     <TableCell>{exam.class?.name} {exam.class?.section?.name && `- ${exam.class.section.name}`}</TableCell>
//                                                     <TableCell>{exam.subject?.name}</TableCell>
//                                                     <TableCell>{exam.roomNumber}</TableCell>
//                                                     <TableCell>
//                                                         <Badge variant={exam.isPublished ? "default" : "secondary"}>
//                                                             {exam.isPublished ? "Published" : "Draft"}
//                                                         </Badge>
//                                                     </TableCell>
//                                                     <TableCell className="text-right">
//                                                         <div className="flex justify-end gap-2">
//                                                             <Button
//                                                                 variant="outline"
//                                                                 size="sm"
//                                                                 onClick={() => handleEdit(exam)}
//                                                                 className="flex items-center gap-1"
//                                                             >
//                                                                 <Edit className="w-3 h-3" />
//                                                                 Edit
//                                                             </Button>
//                                                             <Button
//                                                                 variant="destructive"
//                                                                 size="sm"
//                                                                 onClick={() => handleDelete(exam._id)}
//                                                                 className="flex items-center gap-1"
//                                                             >
//                                                                 <Trash2 className="w-3 h-3" />
//                                                                 Delete
//                                                             </Button>
//                                                         </div>
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ))
//                                         )}
//                                     </TableBody>
//                                 </Table>
//                             </CardContent>
//                         </Card>
//                     </TabsContent>
//                 )}

//                 {user?.role === 'student' && (
//                     <TabsContent value="my-exams">
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle>My Upcoming Exams</CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 {studentExams.length === 0 ? (
//                                     <div className="text-center py-8 text-gray-500">
//                                         No upcoming exams scheduled.
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-4">
//                                         {studentExams.map((exam) => (
//                                             <div key={exam._id} className="border rounded-lg p-4 hover:bg-gray-50">
//                                                 <div className="flex justify-between items-start">
//                                                     <div className="space-y-2">
//                                                         <div className="flex items-center gap-2">
//                                                             <Badge variant="outline" className={getExamTypeColor(exam.examType)}>
//                                                                 {exam.examType}
//                                                             </Badge>
//                                                             <h4 className="font-semibold text-lg">{exam.title}</h4>
//                                                         </div>
//                                                         <div className="grid grid-cols-2 gap-4">
//                                                             <div className="flex items-center gap-2">
//                                                                 <BookOpen className="w-4 h-4 text-gray-500" />
//                                                                 <span>{exam.subject?.name}</span>
//                                                             </div>
//                                                             <div className="flex items-center gap-2">
//                                                                 <MapPin className="w-4 h-4 text-gray-500" />
//                                                                 <span>{exam.roomNumber}</span>
//                                                             </div>
//                                                         </div>
//                                                         <div className="grid grid-cols-2 gap-4">
//                                                             <div className="flex items-center gap-2">
//                                                                 <Calendar className="w-4 h-4 text-gray-500" />
//                                                                 <span>{formatDate(exam.examDate)}</span>
//                                                             </div>
//                                                             <div className="flex items-center gap-2">
//                                                                 <Clock className="w-4 h-4 text-gray-500" />
//                                                                 <span>{exam.startTime} - {exam.endTime}</span>
//                                                             </div>
//                                                         </div>
//                                                         {exam.monitoringTeachers && exam.monitoringTeachers.length > 0 && (
//                                                             <div className="flex items-center gap-2">
//                                                                 <Users className="w-4 h-4 text-gray-500" />
//                                                                 <span className="text-sm">
//                                                                     {exam.monitoringTeachers.map(t => t.user?.name).join(', ')}
//                                                                 </span>
//                                                             </div>
//                                                         )}
//                                                         <div className="text-sm text-gray-600">
//                                                             <p>Total Marks: {exam.totalMarks} | Passing: {exam.passingMarks}</p>
//                                                             {exam.instructions && (
//                                                                 <p className="mt-2">Instructions: {exam.instructions}</p>
//                                                             )}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </CardContent>
//                         </Card>
//                     </TabsContent>
//                 )}

//                 {user?.role === 'teacher' && (
//                     <TabsContent value="monitoring">
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle>My Monitoring Schedule</CardTitle>
//                             </CardHeader>
//                             <CardContent>
//                                 {teacherExams.length === 0 ? (
//                                     <div className="text-center py-8 text-gray-500">
//                                         No monitoring duties scheduled.
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-4">
//                                         {teacherExams.map((exam) => (
//                                             <div key={exam._id} className="border rounded-lg p-4 hover:bg-gray-50">
//                                                 <div className="flex justify-between items-start">
//                                                     <div className="space-y-2">
//                                                         <div className="flex items-center gap-2">
//                                                             <Badge variant="outline" className={getExamTypeColor(exam.examType)}>
//                                                                 {exam.examType}
//                                                             </Badge>
//                                                             <h4 className="font-semibold text-lg">{exam.title}</h4>
//                                                         </div>
//                                                         <div className="grid grid-cols-2 gap-4">
//                                                             <div className="flex items-center gap-2">
//                                                                 <BookOpen className="w-4 h-4 text-gray-500" />
//                                                                 <span>{exam.subject?.name}</span>
//                                                             </div>
//                                                             <div className="flex items-center gap-2">
//                                                                 <MapPin className="w-4 h-4 text-gray-500" />
//                                                                 <span>{exam.roomNumber}</span>
//                                                             </div>
//                                                         </div>
//                                                         <div className="grid grid-cols-2 gap-4">
//                                                             <div className="flex items-center gap-2">
//                                                                 <Calendar className="w-4 h-4 text-gray-500" />
//                                                                 <span>{formatDate(exam.examDate)}</span>
//                                                             </div>
//                                                             <div className="flex items-center gap-2">
//                                                                 <Clock className="w-4 h-4 text-gray-500" />
//                                                                 <span>{exam.startTime} - {exam.endTime}</span>
//                                                             </div>
//                                                         </div>
//                                                         <div className="text-sm">
//                                                             <p>Class: {exam.class?.name} {exam.class?.section?.name && `- ${exam.class.section.name}`}</p>
//                                                             <p>Total Students: {exam.class?.students?.length || 0}</p>
//                                                             <p>Total Marks: {exam.totalMarks}</p>
//                                                         </div>
//                                                         {exam.instructions && (
//                                                             <div className="text-sm text-gray-600">
//                                                                 <p>Instructions: {exam.instructions}</p>
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </CardContent>
//                         </Card>
//                     </TabsContent>
//                 )}

//                 <TabsContent value="calendar">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Exam Calendar</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-center py-8 text-gray-500">
//                                 Calendar view coming soon...
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>

//             {(user?.role === 'admin' || user?.role === 'teacher') && (
//                 <ExamRoutineForm
//                     open={isFormOpen}
//                     onOpenChange={handleFormClose}
//                     initialData={editingExam}
//                 />
//             )}
//         </div>
//     );
// }