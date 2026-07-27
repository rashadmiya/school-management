// components/admin/directory/CommitteeManager.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Edit, Trash2, Plus, User, Phone, MapPin, Award, Quote, } from "lucide-react";
import CommitteeForm from "./components/CommitteeForm";
import { useGetCommitteeQuery } from "@/features/apis/directoryApi";
import { handleApiError } from "@/utils/handleApiErrors";

// Mock API hook
const useCommitteeData = () => {
  const [committeeList, setCommitteeList] = useState([
    {
      _id: "1",
      name: "Dr. Ahmed Khan",
      designation: "chairman",
      session: "2024-2025",
      phoneNumber: "01712345678",
      address: "456 Committee Road, Dhaka",
      religion: "Islam",
      photo: "",
      order: 1,
      isActive: true
    },
    {
      _id: "2",
      name: "Mrs. Salma Akter",
      designation: "secretary",
      session: "2024-2025",
      phoneNumber: "01898765432",
      address: "789 Secretariat St, Dhaka",
      religion: "Islam",
      photo: "",
      order: 2,
      isActive: true
    }
  ]);

  return {
    data: { committee: committeeList },
    isLoading: false,
    refetch: () => { }
  };
};

export default function CommitteeManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    session: "",
    designation: "",
    isActive: "",
    page: 1,
    limit: 20
  });

  const { data, isLoading } = useGetCommitteeQuery();
  const committee = data?.committee || [];

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      handleApiError("Committee member deleted successfully");
    } catch (err) {
      handleApiError(err || "Failed to delete committee member");
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
      designation: "",
      isActive: "",
      page: 1,
      limit: 20
    });
  };

  const hasActiveFilters = filters.search || filters.session || filters.designation || filters.isActive;

  // Designation options with labels
  const designationOptions = [
    { value: "chairman", label: "Chairman" },
    { value: "secretary", label: "Secretary" },
    { value: "treasurer", label: "Treasurer" },
    { value: "principal", label: "Principal" },
    { value: "member", label: "Member" }
  ];

  // Get unique sessions
  const sessions = [...new Set(committee.map(m => m.session))].filter(Boolean);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading committee data...</div>
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
              <CardTitle className="text-2xl">School Management Committee</CardTitle>
              <p className="text-gray-600">
                Manage school management committee members and their designations
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
                  {designationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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

      {/* Committee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {committee.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No committee members match your filters" : "No committee members found. Add your first member to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                committee
                  .toSorted((a, b) => a.order - b.order)
                  .map((member) => (
                    <TableRow key={member._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Badge variant="outline" className="font-mono">
                            {member.order}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            {member.photo ? (
                              <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            {member.religion && (
                              <div className="text-xs text-gray-500">
                                {member.religion}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gray-500" />
                          <Badge variant={
                            member.designation === "chairman" ? "default" :
                              member.designation === "secretary" ? "secondary" :
                                "outline"
                          }>
                            {designationOptions.find(d => d.value === member.designation)?.label || member.designation}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Quote className="w-4 h-4 text-gray-500" />
                          <Badge variant="outline">
                            {member.quote ?? "-"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {member.phoneNumber || "N/A"}
                          </div>
                          {member.address && (
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {member.address}
                            </div>
                          )}
                        </div>
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

      {/* Committee Form Dialog */}
      <CommitteeForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingMember}
      />
    </div>
  );
}