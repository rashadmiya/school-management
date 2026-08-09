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
import { useAppSelector } from "@/features/store";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function RoutineList({ classes = [], teachers = [], subjects = [] }) {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const [filters, setFilters] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const { data, isLoading, refetch } = useGetRoutinesQuery(filters);
  const [deleteRoutine] = useDeleteRoutineMutation();

  const routines = data?.routines || [];

  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    button: {
      primary: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white" 
        : "bg-blue-600 hover:bg-blue-700 text-white",
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
      destructive: isDarkMode 
        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" 
        : "bg-red-500 text-white hover:bg-red-600",
    },
    badge: {
      day: (day) => {
        const colors = {
          Monday: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
          Tuesday: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
          Wednesday: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
          Thursday: isDarkMode ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-800",
          Friday: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
          Saturday: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
          Sunday: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800"
        };
        return colors[day] || (isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800");
      },
      secondary: isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : "",
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
    },
    select: {
      trigger: isDarkMode 
        ? "bg-gray-800 border-gray-700 text-white" 
        : "bg-white border-gray-200 text-gray-900",
      content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
      item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
    }
  };

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
      Monday: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
      Tuesday: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
      Wednesday: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
      Thursday: isDarkMode ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-800",
      Friday: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
      Saturday: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
      Sunday: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800"
    };
    return colors[day] || (isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800");
  };

  if (isLoading) {
    return (
      <Card className={isDarkMode ? "bg-gray-900/50 border-gray-800" : ""}>
        <CardContent className="p-6">
          <div className={`text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading routines...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className={`text-2xl ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Class Routines
            </CardTitle>
            <Button 
              onClick={handleAddNew} 
              className={`flex items-center gap-2 ${theme.button.primary}`}
            >
              <Plus className="w-4 h-4" />
              Add Routine
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Filters:
              </span>
            </div>

            <Select onValueChange={(value) => updateFilter("class", value === "all" ? undefined : value)}>
              <SelectTrigger className={`w-40 ${theme.select.trigger}`}>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className={theme.select.content}>
                <SelectItem value="all" className={theme.select.item}>All Classes</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem._id} value={classItem._id} className={theme.select.item}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => updateFilter("teacher", value === "all" ? undefined : value)}>
              <SelectTrigger className={`w-40 ${theme.select.trigger}`}>
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent className={theme.select.content}>
                <SelectItem value="all" className={theme.select.item}>All Teachers</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher._id} value={teacher._id} className={theme.select.item}>
                    {teacher.user?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => updateFilter("day", value === "all" ? undefined : value)}>
              <SelectTrigger className={`w-40 ${theme.select.trigger}`}>
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent className={theme.select.content}>
                <SelectItem value="all" className={theme.select.item}>All Days</SelectItem>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day} className={theme.select.item}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routines Table */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                <TableRow className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Class</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Subject</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Teacher</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Day</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Time</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Room</TableHead>
                  <TableHead className={`text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routines.length === 0 ? (
                  <TableRow className={isDarkMode ? "border-gray-800" : ""}>
                    <TableCell colSpan={7} className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No routines found. Create your first routine to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  routines.map((routine) => (
                    <TableRow 
                      key={routine._id} 
                      className={`${isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                    >
                      <TableCell className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {routine.class?.name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {routine.subject?.name}
                          </div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {routine.subject?.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                        {routine.teacher?.user?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDayColor(routine.day)}>
                          {routine.day}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`font-mono text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {routine.startTime} - {routine.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        {routine.roomNumber ? (
                          <Badge variant="secondary" className={isDarkMode ? "bg-gray-800 text-gray-300 border-gray-700" : ""}>
                            {routine.roomNumber}
                          </Badge>
                        ) : (
                          <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(routine)}
                            className={`flex items-center gap-1 ${theme.button.outline}`}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(routine._id)}
                            className={`flex items-center gap-1 ${theme.button.destructive}`}
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
          </div>
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
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
