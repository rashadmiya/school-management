// pages/public/administration/StaffInformationPage.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Briefcase, Users, Mail, Phone, Calendar, User, Filter, X } from "lucide-react";
import { useGetPublicStaffQuery } from "@/features/apis/directoryApi";

export default function StaffInformationPage() {
  const [filters, setFilters] = useState({
    search: "",
    session: "",
    designation: ""
  });

  const { data, isLoading } = useGetPublicStaffQuery(filters);
  const staff = data?.staff || [];

  // Filter out teachers (we show only non-teaching staff here)
  const teacherDesignations = ['Teacher', 'Professor', 'Lecturer', 'Instructor', 'Assistant Teacher', 'Senior Teacher'];
  const nonTeachingStaff = staff.filter(member => 
    !teacherDesignations.some(designation => 
      member.designation?.toLowerCase().includes(designation.toLowerCase())
    )
  );

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
    setFilters({ search: "", session: "", designation: "" });
  };

  const hasActiveFilters = filters.search || filters.session || filters.designation;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Staff Information</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Meet our dedicated support staff who keep our institution running smoothly
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or phone..."
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
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessionOptions.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.designation || "all"}
              onValueChange={(value) => updateFilter('designation', value == "all" ? undefined : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designationOptions.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
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

      {nonTeachingStaff.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">
              {hasActiveFilters ? "No staff members match your filters." : "No staff members found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonTeachingStaff.map((member) => (
              <Card key={member._id} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{member.name}</h3>
                      <div className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-2">
                        {member.designation}
                      </div>
                      {member.phoneNumber && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{member.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Session: {member.session}</span>
                      </div>
                      {member.joiningDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>Joined: {new Date(member.joiningDate).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{nonTeachingStaff.length}</div>
                  <div className="text-sm text-gray-600">Staff Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {new Set(nonTeachingStaff.map(s => s.designation)).size}
                  </div>
                  <div className="text-sm text-gray-600">Designations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {nonTeachingStaff.filter(s => s.phoneNumber).length}
                  </div>
                  <div className="text-sm text-gray-600">Contact Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(nonTeachingStaff.map(s => s.session)).size}
                  </div>
                  <div className="text-sm text-gray-600">Active Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}