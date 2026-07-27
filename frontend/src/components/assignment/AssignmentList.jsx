// components/assignments/AssignmentList.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Search, Calendar, BookOpen, Filter } from "lucide-react";
import { useGetAssignmentsQuery, useDeleteAssignmentMutation } from "@/features/apis/assignmentsApi";
import AssignmentForm from "./AssignmentForm";
import { format, isAfter, isBefore } from "date-fns";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { handleApiError } from "@/utils/handleApiErrors";


export default function AssignmentList({ classes = [], subjects = [], showFilters = true }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useGetAssignmentsQuery(filters);
  const [deleteAssignment] = useDeleteAssignmentMutation();

  const assignments = data?.assignments || [];

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await deleteAssignment(id).unwrap();
      refetch();
    } catch (err) {
      handleApiError(err || "Failed to delete assignment");
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAssignment(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAssignment(null);
    refetch();
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);

    if (isAfter(due, now)) {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Overdue', color: 'bg-red-100 text-red-800' };
    }
  };

  const isDueSoon = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return isAfter(due, now) && isBefore(due, threeDaysFromNow);
  };

  // Filter assignments by search query
  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.class?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl">Assignments</CardTitle>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Assignment
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Filter by:</span>
              </div>

              {/* Search */}
              <div className="relative min-w-fit">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assignment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {`${classItem.name} ( ${classItem.section || ""} )`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) => updateFilter("subject", value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) => updateFilter("status", value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery || Object.values(filters).some(f => f) ? (
                      "No assignments found matching your criteria."
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                        <p>No assignments found.</p>
                        <p className="text-sm">Create your first assignment to get started.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssignments.map((assignment) => {
                  const status = getStatus(assignment.dueDate);
                  const dueSoon = isDueSoon(assignment.dueDate);

                  return (
                    <TableRow key={assignment._id} className={dueSoon ? 'bg-yellow-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="truncate">{assignment.title}</span>
                          </div>
                          {assignment.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.class?.name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.subject?.name}</div>
                          <div className="text-sm text-gray-500">{assignment.subject?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className={dueSoon ? 'font-medium text-yellow-700' : ''}>
                            {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                          </span>
                          {dueSoon && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                              Soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.createdBy?.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(assignment)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(assignment._id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assignment Form Dialog */}
      <AssignmentForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingAssignment}
        classes={classes}
        subjects={subjects}
      />
    </div>
  );
}


// import React from "react";
// import DataTable from "@/components/common/DataTable";
// import AssignmentForm from "./AssignmentForm";
// import { useGetAssignmentsQuery, useDeleteAssignmentMutation } from "@/features/apis/assignmentsApi";
// import { Button } from "@/components/ui/button";

// export default function AssignmentList(){
//   const { data, isLoading } = useGetAssignmentsQuery();
//   const [deleteAssignment] = useDeleteAssignmentMutation();

//   const handleDelete = async (id) => {
//     if (!confirm("Delete assignment?")) return;
//     await deleteAssignment(id).unwrap();
//   };

//   const columns = [
//     { key: "title", title: "Title" },
//     { key: "class.name", title: "Class" },
//     { key: "subject.name", title: "Subject" },
//     { key: "dueDate", title: "Due" },
//     { key: "action", title: "Actions", render: row => <div className="flex gap-2"><AssignmentForm initialData={row} triggerLabel="Edit" onSaved={()=>{}}/><Button variant="destructive" onClick={()=>handleDelete(row._id)}>Delete</Button></div> }
//   ];

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-bold">Assignments</h2>
//         <AssignmentForm onSaved={() => {}} />
//       </div>

//       <DataTable columns={columns} data={data?.docs || []} loading={isLoading} />
//     </div>
//   );
// }
