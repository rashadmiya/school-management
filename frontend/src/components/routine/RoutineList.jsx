// components/routines/RoutineList.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Filter } from "lucide-react";
import { useGetRoutinesQuery, useDeleteRoutineMutation } from "@/features/apis/routineApi";
import RoutineForm from "./RoutineForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function RoutineList({ classes = [], teachers = [], subjects=[] }) {
  const [filters, setFilters] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const { data, isLoading, refetch } = useGetRoutinesQuery(filters);
  const [deleteRoutine] = useDeleteRoutineMutation();

  const routines = data?.routines || [];

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this routine?")) return;
    try {
      await deleteRoutine(id).unwrap();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete routine");
    }
  };

  const handleEdit = (routine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRoutine(null);
    refetch();
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getDayColor = (day) => {
    const colors = {
      Monday: "bg-blue-100 text-blue-800",
      Tuesday: "bg-green-100 text-green-800",
      Wednesday: "bg-yellow-100 text-yellow-800",
      Thursday: "bg-purple-100 text-purple-800",
      Friday: "bg-red-100 text-red-800",
      Saturday: "bg-orange-100 text-orange-800",
      Sunday: "bg-gray-100 text-gray-800"
    };
    return colors[day] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading routines...</div>
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
            <CardTitle className="text-2xl">Class Routines</CardTitle>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Routine
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem._id} value={classItem._id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              // onValueChange={(value) => updateFilter("teacher", value)}
              onValueChange={(value) => updateFilter("teacher", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher._id} value={teacher._id}>
                    {teacher.user?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              // onValueChange={(value) => updateFilter("day", value)}
              onValueChange={(value) => updateFilter("day", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routines Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No routines found. Create your first routine to get started.
                  </TableCell>
                </TableRow>
              ) : (
                routines.map((routine) => (
                  <TableRow key={routine._id}>
                    <TableCell className="font-medium">
                      {routine.class?.name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{routine.subject?.name}</div>
                        <div className="text-sm text-gray-500">{routine.subject?.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {routine.teacher?.user?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getDayColor(routine.day)}>
                        {routine.day}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {routine.startTime} - {routine.endTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      {routine.roomNumber ? (
                        <Badge variant="secondary">{routine.roomNumber}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(routine)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(routine._id)}
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

      {/* Routine Form Dialog */}
      <RoutineForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingRoutine}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
      // You'll need to pass subjects too
      />
    </div>
  );
}
