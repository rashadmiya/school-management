// components/admin/directory/CabinetManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetCabinetQuery } from "@/features/apis/directoryApi";
import { handleApiError } from "@/utils/handleApiErrors";
import { BookOpen, Edit, Filter, Plus, Search, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import CabinetForm from "./components/CabinetForm";
import { toast } from "sonner";

// Mock API hook
const useCabinetData = () => {
  const [cabinetList, setCabinetList] = useState([
    {
      _id: "1",
      name: "Rahim Ahmed",
      class: { _id: "1", name: "10" },
      section: { _id: "1", name: "A" },
      rollNumber: "10A001",
      student: { _id: "1", name: "Rahim Ahmed" },
      designation: "president",
      session: "2024-2025",
      isActive: true
    },
    {
      _id: "2",
      name: "Fatima Begum",
      class: { _id: "1", name: "10" },
      section: { _id: "1", name: "A" },
      rollNumber: "10A002",
      student: { _id: "2", name: "Fatima Begum" },
      designation: "vice_president",
      session: "2024-2025",
      isActive: true
    }
  ]);

  return {
    data: { cabinet: cabinetList },
    isLoading: false,
    refetch: () => { }
  };
};

export default function CabinetManager({ classes = [] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    session: "",
    class: "",
    designation: "",
    isActive: "",
    page: 1,
    limit: 20
  });

  const { data, isLoading } = useGetCabinetQuery();
  const cabinet = data?.cabinet || [];

  console.log("cabinet:", data)

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove "${name}" from student cabinet?`)) return;
    try {
      toast.success("Cabinet member removed successfully");
    } catch (err) {
      handleApiError(err || "Failed to remove cabinet member");
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      session: "",
      class: "",
      designation: "",
      isActive: "",
      page: 1,
      limit: 20
    });
  };

  const hasActiveFilters = filters.search || filters.session || filters.class || filters.designation || filters.isActive;

  // Designation options with labels
  const designationOptions = [
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "member", label: "Member" }
  ];

  // Get unique sessions and classes
  const sessions = [...new Set(cabinet.map(m => m.session))].filter(Boolean);
  const availableClasses = [...new Set(cabinet.map(m => m.class?._id))].filter(Boolean);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading cabinet data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Student Cabinet</CardTitle>
              <p className="text-gray-600">
                Manage student cabinet members and their positions
              </p>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                <X className="w-3 h-3" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Class */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={filters.class ?? "all"}
                onValueChange={(value) => updateFilter('class', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name} {cls.section?.name ? `- ${cls.section.name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <Select value={filters.designation ?? "all"}
                onValueChange={(value) => updateFilter('designation', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {designationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.isActive ?? "all"}
                onValueChange={(value) => updateFilter('isActive', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cabinet Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cabinet.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No cabinet members match your filters" : "No cabinet members found. Add your first member to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                cabinet.map((member) => (
                  <TableRow key={member._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          {member.student?.name && member.student.name !== member.name && (
                            <div className="text-xs text-gray-500">
                              As: {member.student.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{member.class?.name}</div>
                          {member.section?.name && (
                            <div className="text-xs text-gray-500">
                              Section: {member.section.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={
                        member.designation === "president" ? "default" :
                          member.designation === "vice_president" ? "secondary" :
                            "outline"
                      }>
                        {designationOptions.find(d => d.value === member.designation)?.label || member.designation}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{member.rollNumber}</code>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {member.session}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={member.isActive ? "default" : "outline"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member._id, member.name)}
                          className="flex items-center gap-1 h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Cabinet Form Dialog */}
      <CabinetForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingMember}
        classes={classes}
      />
    </div>
  );
}