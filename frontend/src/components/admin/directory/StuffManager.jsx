// components/admin/directory/StuffManager.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Edit, Trash2, Plus, Eye, User, Phone, Calendar, GraduationCap } from "lucide-react";
import StuffForm from "./components/StuffForm";
import { useGetStaffQuery } from "@/features/apis/directoryApi";
import { handleApiError } from "@/utils/handleApiErrors";

// Mock API hook - Replace with real API
const useStuffData = () => {
  const [stuffList, setStuffList] = useState([
    {
      _id: "1",
      name: "John Smith",
      designation: "Accountant",
      session: "2024-2025",
      dateOfBirth: "1985-06-15",
      nationalIdNo: "1234567890",
      lastQualification: {
        name: "M.Com",
        major: "Accounting",
        institute: "University of Dhaka"
      },
      phoneNumber: "01712345678",
      address: "123 Main St, Dhaka",
      religion: "Christian",
      photo: "",
      joiningDate: "2020-01-15",
      isActive: true
    }
  ]);

  return {
    data: { stuff: stuffList },
    isLoading: false,
    refetch: () => { }
  };
};

export default function StuffManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStuff, setEditingStuff] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    session: "",
    designation: "",
    isActive: "",
    page: 1,
    limit: 20
  });

  const { data, isLoading } = useGetStaffQuery();
  const stuff = data?.staff || [];
  // const { data:stuffData, isLoading:isStuffLoading} = useGetStaffQuery();
  // console.log("stuffData :", stuff)

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      // await deleteStuff(id).unwrap();
      handleApiError("Staff member deleted successfully");
    } catch (err) {
      handleApiError(err?.data?.message || "Failed to delete staff member");
    }
  };

  const handleEdit = (stuffItem) => {
    setEditingStuff(stuffItem);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingStuff(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingStuff(null);
    // refetch();
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      session: "",
      designation: "",
      isActive: "",
      page: 1,
      limit: 20
    });
  };

  const hasActiveFilters = filters.search || filters.session || filters.designation || filters.isActive;

  // Get unique designations and sessions for filters
  const designations = [...new Set(stuff.map(s => s.designation))].filter(Boolean);
  const sessions = [...new Set(stuff.map(s => s.session))].filter(Boolean);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading staff data...</div>
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
              <CardTitle className="text-2xl">Staff Management</CardTitle>
              <p className="text-gray-600">
                Manage non-teaching staff members of the school
              </p>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Staff
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
                  placeholder="Search staff..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Designation</label>
              <Select value={filters.designation ?? "all"}
                onValueChange={(value) => updateFilter('designation', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {designations.map(designation => (
                    <SelectItem key={designation} value={designation}>{designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <Select value={filters.session ?? "all"}
                onValueChange={(value) => updateFilter('session', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map(session => (
                    <SelectItem key={session} value={session}>{session}</SelectItem>
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

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stuff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No staff members match your filters" : "No staff members found. Add your first staff member to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                stuff.map((staff) => (
                  <TableRow key={staff._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {staff.photo ? (
                            <img src={staff.photo} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-xs text-gray-500">
                            ID: {staff.nationalIdNo || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {staff.designation}
                        </Badge>
                        {staff.joiningDate && (
                          <div className="text-xs text-gray-500">
                            Since {new Date(staff.joiningDate).getFullYear()}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {staff.phoneNumber}
                        </div>
                        {staff.address && (
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {staff.address}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {staff.lastQualification?.name ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">{staff.lastQualification.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {staff.lastQualification.major} • {staff.lastQualification.institute}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{staff.session}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={staff.isActive ? "default" : "outline"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(staff)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(staff._id, staff.name)}
                          className="flex items-center gap-1 h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
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

      {/* Staff Form Dialog */}
      <StuffForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingStuff}
      />
    </div>
  );
}