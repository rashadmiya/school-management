// components/student/StudentAssignments.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useGetAssignmentWithSubmissionQuery, useGetStudentAssignmentsQuery, useSubmitAssignmentMutation } from "@/features/apis/studentsApi";
import { format, isAfter, isBefore, isToday } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function StudentAssignments() {
  const [filter, setFilter] = useState("all");
  // Enhanced StudentAssignments.jsx
  const { data, isLoading, refetch } = useGetStudentAssignmentsQuery();
  const assignments = data?.assignments || [];
  // Real submission status from backend
  const categorizedAssignments = {
    pending: assignments.filter(a => a.status === 'pending'),
    overdue: assignments.filter(a => a.status === 'overdue'),
    submitted: assignments.filter(a => a.status === 'submitted'),
    all: assignments
  };

  // Submit assignment handler
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAssignmentId, setDetailAssignmentId] = useState(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [submitAssignment, { isLoading: isSubmitting }] = useSubmitAssignmentMutation();

  const handleOpenSubmitModal = (assignment) => {
    setCurrentAssignment(assignment);
    setIsSubmitModalOpen(true);
  };

  const handleCloseSubmitModal = () => {
    setIsSubmitModalOpen(false);
    setCurrentAssignment(null);
    setContent('');
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentAssignment) return;

    try {
      const formData = {
        content,
        files: selectedFiles,
      };
      await submitAssignment({ assignmentId: currentAssignment._id, data: formData }).unwrap();
      // Success
      handleCloseSubmitModal();
      // Optionally, refetch the assignments to update the status
      refetch();
    } catch (error) {
      // Handle error
      console.error('Failed to submit assignment:', error);
    }
  };


  const { data: assignmentDetail } = useGetAssignmentWithSubmissionQuery(detailAssignmentId, {
    skip: !detailAssignmentId,
  });

  const handleOpenDetailModal = (assignment) => {
    setDetailAssignmentId(assignment._id);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailAssignmentId(null);
  };


  // const { data, isLoading } = useGetStudentAssignmentsQuery();
  // const assignments = data?.assignments || [];

  // // Categorize assignments
  // const categorizedAssignments = {
  //   pending: assignments.filter(assignment => 
  //     isAfter(new Date(assignment.dueDate), new Date()) && !assignment.submitted
  //   ),
  //   overdue: assignments.filter(assignment => 
  //     isBefore(new Date(assignment.dueDate), new Date()) && !assignment.submitted
  //   ),
  //   submitted: assignments.filter(assignment => assignment.submitted),
  //   all: assignments
  // };

  const currentAssignments = categorizedAssignments[filter] || [];

  const getStatusBadge = (assignment) => {
    const dueDate = new Date(assignment.dueDate);

    if (assignment.submitted) {
      return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
    }

    if (isBefore(dueDate, new Date())) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    if (isToday(dueDate)) {
      return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>;
    }

    return <Badge variant="outline">Pending</Badge>;
  };

  const getUrgencyColor = (dueDate) => {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return "text-red-600";
    if (daysUntilDue === 0) return "text-orange-600";
    if (daysUntilDue <= 2) return "text-yellow-600";
    return "text-gray-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading assignments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-gray-600 mt-2">Track and manage your academic assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categorizedAssignments.submitted.length}</p>
                <p className="text-sm text-gray-600">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categorizedAssignments.pending.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categorizedAssignments.overdue.length}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {currentAssignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No assignments found</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAssignments.map((assignment) => (
                      <TableRow key={assignment._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            {assignment.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assignment.subject?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {assignment.class?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${getUrgencyColor(assignment.dueDate)}`}>
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(assignment)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDetailModal(assignment)}>
                              View Details
                            </Button>
                            {!assignment.submitted && (
                              <Button size="sm" onClick={() => handleOpenSubmitModal(assignment)}>
                                Submit Work
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upcoming Deadlines */}
      {categorizedAssignments.pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Upcoming Deadlines (Next 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categorizedAssignments.pending
                .filter(assignment => {
                  const dueInDays = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return dueInDays <= 7 && dueInDays >= 0;
                })
                .slice(0, 3)
                .map((assignment) => (
                  <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.subject?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getUrgencyColor(assignment.dueDate)}`}>
                        Due in {Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Submit your work for {currentAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Written Content (Optional)
                </label>
                <textarea
                  id="content"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="files" className="block text-sm font-medium text-gray-700">
                  Upload Files (Max 5)
                </label>
                <input
                  type="file"
                  id="files"
                  multiple
                  accept="*/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCloseSubmitModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignmentDetail?.assignment?.title}</DialogTitle>
            <DialogDescription>
              {assignmentDetail?.assignment?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Due Date</h3>
              {/* <p>{format(new Date(assignmentDetail?.assignment?.dueDate), 'MMM dd, yyyy')}</p> */}
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <p>{assignmentDetail?.submission ? 'Submitted' : 'Not Submitted'}</p>
            </div>
            {assignmentDetail?.submission && (
              <div>
                <h3 className="font-medium">Submitted On</h3>
                <p>{format(new Date(assignmentDetail.submission.submittedAt), 'MMM dd, yyyy')}</p>
                {assignmentDetail.submission.files && assignmentDetail.submission.files.length > 0 && (
                  <div>
                    <h3 className="font-medium">Submitted Files</h3>
                    <ul>
                      {assignmentDetail.submission.files.map((file, index) => (
                        <li key={index}>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            {file.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assignmentDetail.submission.content && (
                  <div>
                    <h3 className="font-medium">Written Content</h3>
                    <p>{assignmentDetail.submission.content}</p>
                  </div>
                )}
                {assignmentDetail.submission.grade && (
                  <div>
                    <h3 className="font-medium">Grade</h3>
                    <p>{assignmentDetail.submission.grade.score} / {assignmentDetail.submission.grade.maxScore}</p>
                    <p>{assignmentDetail.submission.grade.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDetailModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}