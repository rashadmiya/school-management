// pages/SubjectDetailsPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  GraduationCap,
  Clock,
  Edit,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";
import { 
  useGetSubjectQuery,
  useRemoveSubjectFromClassMutation
} from "@/features/apis/subjectsApi";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function SubjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedClassToRemove, setSelectedClassToRemove] = useState(null);
  
  const { data, isLoading, refetch } = useGetSubjectQuery(id);
  const [removeSubjectFromClass] = useRemoveSubjectFromClassMutation();

  const subject = data?.subject;
  const relatedData = data?.relatedData || {};

  const handleRemoveClass = async () => {
    if (!selectedClassToRemove) return;
    
    try {
      await removeSubjectFromClass({ 
        id: subject._id, 
        classId: selectedClassToRemove._id 
      }).unwrap();
      
      toast.success(`Subject removed from ${selectedClassToRemove.name}`);
      setSelectedClassToRemove(null);
      setRemoveDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove from class");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading subject details...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Subject not found</div>
        <Button onClick={() => navigate("/admin/subjects")} className="mt-4">
          Back to Subjects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/subjects")} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-baseline gap-2">
              <span>{subject.name}</span>
              {subject.code && (
                <Badge variant="secondary" className="text-lg font-mono">
                  {subject.code}
                </Badge>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>Subject Details</span>
              </div>
              <Badge variant={subject.classes?.length > 0 ? "default" : "outline"}>
                {subject.classes?.length || 0} classes
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/admin/subjects/edit/${id}`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Classes</p>
                <p className="text-2xl font-bold mt-1">{subject.classes?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            {subject.classes?.length > 0 && (
              <p className="mt-3 text-xs text-gray-600">
                Active in {subject.classes.length} classes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-2xl font-bold mt-1">{relatedData.totalTeachers || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            {relatedData.teachers?.length > 0 && (
              <p className="mt-3 text-xs text-gray-600 truncate">
                {relatedData.teachers.slice(0, 2).map(t => t.user?.name).join(', ')}
                {relatedData.teachers.length > 2 && '...'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled Routines</p>
                <p className="text-2xl font-bold mt-1">{relatedData.routines || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">Weekly schedule entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Assignments</p>
                <p className="text-2xl font-bold mt-1">{relatedData.recentAssignments?.length || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-600">Last 5 assignments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">
            Classes ({subject.classes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Subject Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subject Name</p>
                    <p className="font-medium">{subject.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Subject Code</p>
                    <p className="font-mono font-medium">
                      {subject.code || <span className="text-gray-400">Not assigned</span>}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="mt-1">
                      {subject.description || (
                        <span className="text-gray-400 italic">No description provided</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Metadata</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>{' '}
                      <span className="font-medium">
                        {new Date(subject.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>{' '}
                      <span className="font-medium">
                        {new Date(subject.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Subject ID:</span>{' '}
                      <span className="font-mono text-xs">{subject._id?.slice(-8)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/admin/subjects/edit/${id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Subject
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/admin/routines?subject=${id}`)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Routines
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/admin/assignments?subject=${id}`)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Assignments
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(`/admin/exams?subject=${id}`)}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  View Exams
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Classes Teaching This Subject</CardTitle>
              <CardDescription>
                {subject.classes?.length || 0} classes are assigned to this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subject.classes?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subject.classes.map((cls) => (
                    <Card key={cls._id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{cls.name}</p>
                              {cls.section && (
                                <Badge variant="outline" className="mt-1">
                                  Section: {cls.section}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedClassToRemove(cls);
                                setRemoveDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Academic Year:</span>
                              <span className="font-medium">{cls.academicYear}</span>
                            </div>
                            {cls.students?.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Students:</span>
                                <span className="font-medium">{cls.students.length}</span>
                              </div>
                            )}
                            {cls.supervisor?.user?.name && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Supervisor:</span>
                                <span className="font-medium truncate ml-2">
                                  {cls.supervisor.user.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">Not assigned to any classes yet</p>
                  <Button 
                    onClick={() => navigate(`/admin/subjects/edit/${id}`)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Assign to Classes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teachers Assigned to This Subject</CardTitle>
              <CardDescription>
                {relatedData.teachers?.length || 0} teachers are teaching this subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relatedData.teachers?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedData.teachers.map((teacher) => (
                    <Card key={teacher._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{teacher.user?.name}</p>
                            <div className="text-sm text-gray-600">
                              {teacher.designation || "Teacher"}
                            </div>
                            {teacher.user?.email && (
                              <div className="text-xs text-gray-500 mt-1">
                                {teacher.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-2">No teachers assigned to this subject</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <div className="space-y-6">
            {/* Recent Assignments */}
            {relatedData.recentAssignments?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recent Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedData.recentAssignments.map((assignment) => (
                      <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span>Class: {assignment.class?.name}</span>
                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            {assignment.createdBy?.name && (
                              <span>By: {assignment.createdBy.name}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {assignment.mark || "No marks"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Activities
                </CardTitle>
                <CardDescription>
                  Scheduled routines and events for this subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p>Activity timeline coming soon...</p>
                  <p className="text-sm mt-2">
                    View upcoming classes, exams, and assignments for this subject
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Remove from Class Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Remove from Class
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this subject from the class?
            </DialogDescription>
          </DialogHeader>
          
          {selectedClassToRemove && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium">
                Remove "{subject.name}" from "{selectedClassToRemove.name}"?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This will remove the subject from the class's curriculum. 
                Existing assignments and grades will be preserved.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClassToRemove(null);
                setRemoveDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveClass}
            >
              Remove from Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}