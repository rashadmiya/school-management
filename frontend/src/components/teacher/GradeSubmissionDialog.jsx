// components/teacher/GradeSubmissionDialog.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, User, Calendar, Eye } from "lucide-react";
import { toast } from "react-toastify";

export default function GradeSubmissionDialog({
  submission,
  open,
  onOpenChange,
  onGrade,
  onDownloadFile,
  onPreviewFile
}) {
  const [score, setScore] = useState(submission?.grade?.score || '');
  const [maxScore, setMaxScore] = useState(submission?.grade?.maxScore || '');
  const [feedback, setFeedback] = useState(submission?.grade?.feedback || '');

  const handleSubmit = (e) => {
    e.preventDefault();

    const assignmentMark = submission?.grade?.maxScore || maxScore;
    if (!score || !assignmentMark) {
      toast.warn("Please enter both score and maximum score");
      return;
    }

    if (parseFloat(score) > parseFloat(assignmentMark)) {
      toast.warn("Score cannot be greater than maximum score");
      return;
    }

    onGrade(submission._id, {
      score: parseFloat(score),
      maxScore: parseFloat(assignmentMark),
      feedback
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
        </DialogHeader>

        {submission && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{submission.student?.name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Roll No: </span>
                  {submission.student?.rollNumber || 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
                <div>
                  <Badge variant={submission.status === 'late' ? 'destructive' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Submitted Content */}
            {submission.content && (
              <div className="space-y-2">
                <Label>Submitted Content</Label>
                <div className="p-4 border rounded-lg bg-white">
                  <p className="whitespace-pre-wrap">{submission.content}</p>
                </div>
              </div>
            )}

            {/* Submitted Files */}
            {submission.files && submission.files.length > 0 && (
              <div className="space-y-2">
                <Label>Submitted Files</Label>
                <div className="space-y-2">
                  {submission.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(file.mimetype)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.mimetype}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPreviewFile(submission, file)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownloadFile(submission, file)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grading Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Grading</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score">Score</Label>
                  <Input
                    id="score"
                    type="number"
                    step="0.1"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter score"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Maximum Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    step="0.1"
                    value={maxScore || submission?.grade?.maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="Enter maximum score"
                    required
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              {score && maxScore && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    Grade: <strong>{score}/{maxScore}</strong> •
                    Percentage: <strong>{Math.round((score / maxScore) * 100)}%</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {submission.grade?.score ? 'Update Grade' : 'Submit Grade'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// // components/teacher/GradeSubmissionDialog.jsx
// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Download, FileText, User, Calendar } from "lucide-react";
// import { toast } from "react-toastify";

// export default function GradeSubmissionDialog({
//   submission,
//   open,
//   onOpenChange,
//   onGrade
// }) {
//   const [score, setScore] = useState(submission?.grade?.score || '');
//   const [maxScore, setMaxScore] = useState(submission?.grade?.maxScore || '');
//   const [feedback, setFeedback] = useState(submission?.grade?.feedback || '');

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const assignmentMark = submission?.grade?.maxScore || maxScore
//     if (!score || !assignmentMark) {
//       toast.warn("Please enter both score and maximum score");
//       return;
//     }

//     if (parseFloat(score) > parseFloat(assignmentMark)) {
//       toast.warn("Score cannot be greater than maximum score");
//       return;
//     }

//     onGrade(submission._id, {
//       score: parseFloat(score),
//       maxScore: parseFloat(assignmentMark),
//       feedback
//     });
//   };

//   const downloadFile = (file) => {
//     // Create a temporary link to download the file
//     const link = document.createElement('a');
//     link.href = file.url;
//     link.download = file.filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Grade Submission</DialogTitle>
//         </DialogHeader>

//         {submission && (
//           <div className="space-y-6">
//             {/* Student Info */}
//             <div className="p-4 border rounded-lg bg-gray-50">
//               <h3 className="font-semibold mb-3">Student Information</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="flex items-center gap-2">
//                   <User className="w-4 h-4 text-gray-500" />
//                   <span>{submission.student?.name}</span>
//                 </div>
//                 <div>
//                   <span className="text-sm text-gray-600">Roll No: </span>
//                   {submission.student?.rollNumber || 'N/A'}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Calendar className="w-4 h-4 text-gray-500" />
//                   <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
//                 </div>
//                 <div>
//                   <Badge variant={submission.status === 'late' ? 'destructive' : 'secondary'}>
//                     {submission.status}
//                   </Badge>
//                 </div>
//               </div>
//             </div>

//             {/* Submitted Content */}
//             {submission.content && (
//               <div className="space-y-2">
//                 <Label>Submitted Content</Label>
//                 <div className="p-4 border rounded-lg bg-white">
//                   <p className="whitespace-pre-wrap">{submission.content}</p>
//                 </div>
//               </div>
//             )}

//             {/* Submitted Files */}
//             {submission.files && submission.files.length > 0 && (
//               <div className="space-y-2">
//                 <Label>Submitted Files</Label>
//                 <div className="space-y-2">
//                   {submission.files.map((file, index) => (
//                     <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
//                       <div className="flex items-center gap-3">
//                         <FileText className="w-4 h-4 text-blue-500" />
//                         <div>
//                           <p className="text-sm font-medium">{file.filename}</p>
//                           <p className="text-xs text-gray-500">
//                             {(file.size / 1024 / 1024).toFixed(2)} MB
//                           </p>
//                         </div>
//                       </div>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={() => downloadFile(file)}
//                       >
//                         <Download className="w-4 h-4 mr-2" />
//                         Download
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Grading Form */}
//             <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
//               <h3 className="font-semibold">Grading</h3>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="score">Score</Label>
//                   <Input
//                     id="score"
//                     type="number"
//                     step="0.1"
//                     value={score}
//                     onChange={(e) => setScore(e.target.value)}
//                     placeholder="Enter score"
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="maxScore">Maximum Score</Label>
//                   <Input
//                     id="maxScore"
//                     type="number"
//                     step="0.1"
//                     value={maxScore || submission?.grade?.maxScore}
//                     onChange={(e) => setMaxScore(e.target.value)}
//                     placeholder="Enter maximum score"
//                     required
//                     disabled
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="feedback">Feedback</Label>
//                 <Textarea
//                   id="feedback"
//                   placeholder="Provide feedback to the student..."
//                   value={feedback}
//                   onChange={(e) => setFeedback(e.target.value)}
//                   rows={4}
//                 />
//               </div>

//               {score && maxScore && (
//                 <div className="p-3 bg-blue-50 rounded-lg">
//                   <p className="text-sm">
//                     Grade: <strong>{score}/{maxScore}</strong> •
//                     Percentage: <strong>{Math.round((score / maxScore) * 100)}%</strong>
//                   </p>
//                 </div>
//               )}

//               <div className="flex justify-end gap-3 pt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => onOpenChange(false)}
//                 >
//                   Cancel
//                 </Button>
//                 <Button type="submit">
//                   {submission.grade ? 'Update Grade' : 'Submit Grade'}
//                 </Button>
//               </div>
//             </form>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }