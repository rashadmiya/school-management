// pages/public/directory/StuffTab.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Phone, GraduationCap, Calendar, User, Users } from "lucide-react";
import { useGetPublicStaffQuery } from "@/features/apis/directoryApi";
import { Link } from "react-router-dom";

export default function StuffTab() {
  const [filters, setFilters] = useState({
    search: "",
    session: "",
    designation: ""
  });

  const { data, isLoading } = useGetPublicStaffQuery(filters);
  const staff = data?.staff || [];

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const designationOptions = [
    "Accountant", "Clerk", "Librarian", "Lab Assistant", "Peon",
    "Security Guard", "Cleaner", "Driver", "Office Assistant",
    "IT Support", "Registrar", "Store Keeper", "Sports Coach",
    "Counselor", "Nurse", "Other"
  ];

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      session: "",
      designation: ""
    });
  };

  const hasActiveFilters = filters.search || filters.session || filters.designation;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading staff information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search staff by name, phone..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.session ?? "all"}
              onValueChange={(value) => updateFilter('session', value == "all" ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessionOptions.map(session => (
                  <SelectItem key={session} value={session}>{session}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.designation || "all"}
              onValueChange={(value) => updateFilter('designation', value == "all" ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designationOptions.map(designation => (
                  <SelectItem key={designation} value={designation}>{designation}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">
              {hasActiveFilters
                ? "No staff members match your filters."
                : "No staff members found."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <Card key={member._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Photo */}
                  <div className="mb-4">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Name and Designation */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-3">
                    {member.designation}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 w-full mb-4">
                    {member.phoneNumber && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phoneNumber}</span>
                      </div>
                    )}

                    {member.lastQualification?.name && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm">{member.lastQualification.name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {new Date(member.joiningDate).getFullYear()}</span>
                      <span className="mx-1">•</span>
                      <span>Session: {member.session}</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/staff/${member._id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      {staff.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {staff.length} staff members
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4" />
                <span>
                  {filters.designation ? `Filtered by: ${filters.designation}` : 'All designations'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}