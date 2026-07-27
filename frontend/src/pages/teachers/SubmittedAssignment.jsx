// components/teacher/AssignmentSubmissions.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Mail, Calendar, FileText, Eye, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  useDownloadSubmissionFileMutation 
} from "@/features/apis/assignmentsApi";
import{
  useGetAssignmentStatisticsQuery,
  useGetSubmittedAssignmentQuery,
  useGradeSubmissionMutation 
} from "@/features/apis/teachersApi";
import GradeSubmissionDialog from "@/components/teacher/GradeSubmissionDialog";
import FilePreviewModal from "@/components/common/FilePreviewModal";

export default function SubmittedAssignment() {
  const { assignmentId } = useParams();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: submissionsData, isLoading, refetch } = useGetSubmittedAssignmentQuery(assignmentId);
  const { data: statsData } = useGetAssignmentStatisticsQuery(assignmentId);
  const [gradeSubmission] = useGradeSubmissionMutation();
  const [downloadFile] = useDownloadSubmissionFileMutation();

  const assignment = submissionsData?.assignment;
  const submissions = submissionsData?.submissions || [];
  const statistics = statsData?.statistics;

  // Handle file download
  // const handleDownloadFile = async (submission, file) => {
  //   try {
  //     const result = await downloadFile({
  //       submissionId: submission._id,
  //       fileId: file._id
  //     }).unwrap();

  //     // Create download link
  //     const url = window.URL.createObjectURL(result.blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = result.filename || file.filename;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Download failed:", error);
  //     alert("Failed to download file");
  //   }
  // };

  const handleDownloadFile = async (submission, file) => {
  try {
    const result = await downloadFile({
      submissionId: submission._id,
      fileId: file._id,
    }).unwrap();

    const url = window.URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename || file.filename; // ✅ now works correctly
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download file");
  }
};


  // Handle file preview
  const handlePreviewFile = (submission, file) => {
    setSelectedSubmission(submission);
    setSelectedFile(file);
    setIsFilePreviewOpen(true);
  };

  // Download all files as zip (you can implement this later)
  const handleDownloadAllFiles = (submission) => {
    // This would require a backend endpoint to zip files
    alert("Download all feature coming soon!");
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    if (filter === 'submitted') return sub.status === 'submitted' || sub.status === 'late';
    if (filter === 'graded') return sub.status === 'graded';
    if (filter === 'ungraded') return sub.status !== 'graded' && (sub.status === 'submitted' || sub.status === 'late');
    return true;
  });

  const handleGrade = async (submissionId, gradeData) => {
    try {
      await gradeSubmission({ submissionId, ...gradeData }).unwrap();
      setIsGradeDialogOpen(false);
      setSelectedSubmission(null);
      refetch();
    } catch (error) {
      console.error("Grading failed:", error);
    }
  };

  const openGradeDialog = (submission) => {
    setSelectedSubmission(submission);
    setIsGradeDialogOpen(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word')) return '📝';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📊';
    if (mimetype.includes('sheet')) return '📈';
    if (mimetype.startsWith('video/')) return '🎬';
    if (mimetype.startsWith('audio/')) return '🎵';
    return '📎';
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/teacher/assignments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Submissions</h1>
          <p className="text-gray-600">{assignment?.title}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{statistics?.totalStudents || 0}</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{statistics?.submittedCount || 0}</p>
            <p className="text-sm text-gray-600">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{statistics?.notSubmittedCount || 0}</p>
            <p className="text-sm text-gray-600">Not Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{statistics?.gradedCount || 0}</p>
            <p className="text-sm text-gray-600">Graded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{statistics?.pendingGradingCount || 0}</p>
            <p className="text-sm text-gray-600">Pending Grading</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Student Submissions</span>
            <Badge variant="outline">
              {statistics?.submissionRate || 0}% Submission Rate
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="graded">Graded</TabsTrigger>
              <TabsTrigger value="ungraded">To Grade</TabsTrigger>
            </TabsList>

            <TabsContent value={filter}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Submitted Files</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.student?.name}</p>
                          <p className="text-sm text-gray-500">{submission.student?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.student?.rollNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {submission.files && submission.files.length > 0 ? (
                            <div className="space-y-1">
                              {submission.files.slice(0, 2).map((file, index) => (
                                <div key={file._id} className="flex items-center justify-between p-2 border rounded text-sm">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span>{getFileIcon(file.mimetype)}</span>
                                    <span className="truncate flex-1">{`${file.filename.slice(0, 20)}...`}</span>
                                    <span className="text-xs text-gray-500">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePreviewFile(submission, file)}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownloadFile(submission, file)}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {submission.files.length > 2 && (
                                <div className="text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadAllFiles(submission)}
                                  >
                                    <FolderOpen className="w-3 h-3 mr-1" />
                                    +{submission.files.length - 2} more files
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : submission.content ? (
                            <Badge variant="outline" className="text-xs">
                              Text Submission
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-sm">No files</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.submittedAt ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-500">Not submitted</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            submission.status === 'graded' ? 'default' :
                            submission.status === 'late' ? 'destructive' :
                            submission.status === 'submitted' ? 'secondary' : 'outline'
                          }
                        >
                          {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.grade?.score ? (
                          <div>
                            <p className="font-medium">
                              {submission.grade.score}/{submission.grade.maxScore}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round((submission.grade.score / submission.grade.maxScore) * 100)}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not graded</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => openGradeDialog(submission)}
                            disabled={!submission.submittedAt}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {submission.grade?.score ? 'Regrade' : 'Grade'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No submissions found</p>
                  <p className="text-sm">No students have submitted this assignment yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Grade Submission Dialog */}
      <GradeSubmissionDialog
        submission={selectedSubmission}
        open={isGradeDialogOpen}
        onOpenChange={setIsGradeDialogOpen}
        onGrade={handleGrade}
        onDownloadFile={handleDownloadFile}
        onPreviewFile={handlePreviewFile}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={selectedFile}
        submissionId={selectedSubmission?._id}
        open={isFilePreviewOpen}
        onOpenChange={setIsFilePreviewOpen}
        onDownload={() => selectedFile && selectedSubmission && 
          handleDownloadFile(selectedSubmission, selectedFile)}
      />
    </div>
  );
}// // components/teacher/AssignmentSubmissions.jsx
// import React, { useState } from "react";
// import { useParams } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { ArrowLeft, Download, Mail, Calendar, FileText } from "lucide-react";
// import { Link } from "react-router-dom";
// import { 
//   useGetAssignmentStatisticsQuery,
//   useGetSubmittedAssignmentQuery,
//   useGradeSubmissionMutation 
// } from "@/features/apis/teachersApi";
// import GradeSubmissionDialog from "@/components/teacher/GradeSubmissionDialog";

// export default function SubmittedAssignment() {
//   const { assignmentId } = useParams();
//   const [selectedSubmission, setSelectedSubmission] = useState(null);
//   const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
//   const [filter, setFilter] = useState("all");

//   const { data: submissionsData, isLoading, refetch} = useGetSubmittedAssignmentQuery(assignmentId);
//   const { data: statsData } = useGetAssignmentStatisticsQuery(assignmentId);
//   const [gradeSubmission] = useGradeSubmissionMutation();

//   const assignment = submissionsData?.assignment;
//   const submissions = submissionsData?.submissions || [];
//   const statistics = statsData?.statistics;

//   // Filter submissions
//   const filteredSubmissions = submissions.filter(sub => {
//     if (filter === 'all') return true;
//     if (filter === 'submitted') return sub.status === 'submitted' || sub.status === 'late';
//     if (filter === 'graded') return sub.status === 'graded';
//     if (filter === 'ungraded') return sub.status !== 'graded' && (sub.status === 'submitted' || sub.status === 'late');
//     return true;
//   });

//   const handleGrade = async (submissionId, gradeData) => {
//     try {
//       await gradeSubmission({ submissionId, ...gradeData }).unwrap();
//       setIsGradeDialogOpen(false);
//       setSelectedSubmission(null);
//       refetch();
//     } catch (error) {
//       console.error("Grading failed:", error);
//     }
//   };

//   const openGradeDialog = (submission) => {
//     setSelectedSubmission(submission);
//     setIsGradeDialogOpen(true);
//   };

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-4">
//         <Button variant="outline" size="sm" asChild>
//           <Link to="/teacher/assignments">
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back to Assignments
//           </Link>
//         </Button>
//         <div>
//           <h1 className="text-3xl font-bold">Submissions</h1>
//           <p className="text-gray-600">{assignment?.title}</p>
//         </div>
//       </div>

//       {/* Statistics */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//         <Card>
//           <CardContent className="p-4 text-center">
//             <p className="text-2xl font-bold">{statistics?.totalStudents || 0}</p>
//             <p className="text-sm text-gray-600">Total Students</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <p className="text-2xl font-bold text-green-600">{statistics?.submittedCount || 0}</p>
//             <p className="text-sm text-gray-600">Submitted</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <p className="text-2xl font-bold text-red-600">{statistics?.notSubmittedCount || 0}</p>
//             <p className="text-sm text-gray-600">Not Submitted</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <p className="text-2xl font-bold text-blue-600">{statistics?.gradedCount || 0}</p>
//             <p className="text-sm text-gray-600">Graded</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <p className="text-2xl font-bold text-orange-600">{statistics?.pendingGradingCount || 0}</p>
//             <p className="text-sm text-gray-600">Pending Grading</p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Submissions Table */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex justify-between items-center">
//             <span>Student Submissions</span>
//             <Badge variant="outline">
//               {statistics?.submissionRate || 0}% Submission Rate
//             </Badge>
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Tabs value={filter} onValueChange={setFilter}>
//             <TabsList className="grid w-full grid-cols-4">
//               <TabsTrigger value="all">All</TabsTrigger>
//               <TabsTrigger value="submitted">Submitted</TabsTrigger>
//               <TabsTrigger value="graded">Graded</TabsTrigger>
//               <TabsTrigger value="ungraded">To Grade</TabsTrigger>
//             </TabsList>

//             <TabsContent value={filter}>
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Student</TableHead>
//                     <TableHead>Roll Number</TableHead>
//                     <TableHead>Submitted At</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Grade</TableHead>
//                     <TableHead className="text-right">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredSubmissions.map((submission) => (
//                     <TableRow key={submission._id}>
//                       <TableCell>
//                         <div>
//                           <p className="font-medium">{submission.student?.name}</p>
//                           <p className="text-sm text-gray-500">{submission.student?.email}</p>
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         {submission.student?.rollNumber || 'N/A'}
//                       </TableCell>
//                       <TableCell>
//                         {submission.submittedAt ? (
//                           <div className="flex items-center gap-2 text-sm">
//                             <Calendar className="w-4 h-4" />
//                             {new Date(submission.submittedAt).toLocaleDateString()}
//                           </div>
//                         ) : (
//                           <span className="text-gray-500">Not submitted</span>
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         <Badge 
//                           variant={
//                             submission.status === 'graded' ? 'default' :
//                             submission.status === 'late' ? 'destructive' :
//                             submission.status === 'submitted' ? 'secondary' : 'outline'
//                           }
//                         >
//                           {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1)}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {submission.grade.score ? (
//                           <div>
//                             <p className="font-medium">
//                               {submission.grade.score}/{submission.grade.maxScore}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               {Math.round((submission.grade.score / submission.grade.maxScore) * 100)}%
//                             </p>
//                           </div>
//                         ) : (
//                           <span className="text-gray-500">Not graded</span>
//                         )}
//                       </TableCell>
//                       <TableCell className="text-right">
//                         <div className="flex justify-end gap-2">
//                           {submission.files && submission.files.length > 0 && (
//                             <Button variant="outline" size="sm">
//                               <Download className="w-4 h-4 mr-2" />
//                               Download
//                             </Button>
//                           )}
//                           <Button 
//                             size="sm" 
//                             onClick={() => openGradeDialog(submission)}
//                             disabled={!submission.submittedAt}
//                           >
//                             <FileText className="w-4 h-4 mr-2" />
//                             {submission.grade.score ? 'Regrade' : 'Grade'}
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>

//               {filteredSubmissions.length === 0 && (
//                 <div className="text-center py-12 text-gray-500">
//                   <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                   <p className="text-lg">No submissions found</p>
//                   <p className="text-sm">No students have submitted this assignment yet</p>
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>

//       {/* Grade Submission Dialog */}
//       <GradeSubmissionDialog
//         submission={selectedSubmission}
//         open={isGradeDialogOpen}
//         onOpenChange={setIsGradeDialogOpen}
//         onGrade={handleGrade}
//       />
      
//     </div>
//   );
// };