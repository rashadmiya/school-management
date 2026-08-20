// pages/public/administration/StaffInformationPage.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Briefcase, Users, Mail, Phone, Calendar, User, Filter, X, Award, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Staff Information</h1>
        <p className="text-lg text-gray-600">Meet our dedicated support staff who keep our institution running smoothly</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{nonTeachingStaff.length} Staff Members</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{new Set(nonTeachingStaff.map(s => s.designation)).size} Designations</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, phone, or designation..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 rounded-xl"
          />
        </div>
        <Select
          value={filters.session ?? "all"}
          onValueChange={(value) => updateFilter('session', value == "all" ? undefined : value)}
        >
          <SelectTrigger className="w-44 h-11 bg-white border-gray-200 rounded-xl">
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
          <SelectTrigger className="w-48 h-11 bg-white border-gray-200 rounded-xl">
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
          <Button 
            variant="outline" 
            onClick={clearFilters} 
            className="h-11 px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border-gray-200"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">
          Showing {nonTeachingStaff.length} staff members
        </p>
        {hasActiveFilters && (
          <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Filtered
          </span>
        )}
      </div>

      {nonTeachingStaff.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {hasActiveFilters ? "No staff members match your filters." : "No staff members found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonTeachingStaff.map((member) => (
              <Card 
                key={member._id} 
                className="border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
              >
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                        {member.name.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                      {member.designation}
                    </Badge>
                  </div>
                </div>

                <CardContent className="pt-12 pb-4 px-6">
                  <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                  
                  {/* Contact Info */}
                  <div className="mt-3 space-y-2 text-sm">
                    {member.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{member.phoneNumber}</span>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-3 border-t border-gray-100"></div>

                  {/* Session & Joining Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">Session: {member.session}</span>
                    </div>
                    {member.joiningDate && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">Joined: {new Date(member.joiningDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    {member.address && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate">{member.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Staff Badge */}
                  <div className="mt-4">
                    <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {member.designation}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{nonTeachingStaff.length}</div>
              <div className="text-sm text-gray-600">Staff Members</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(nonTeachingStaff.map(s => s.designation)).size}
              </div>
              <div className="text-sm text-gray-600">Designations</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <div className="text-2xl font-bold text-green-600">
                {nonTeachingStaff.filter(s => s.phoneNumber).length}
              </div>
              <div className="text-sm text-gray-600">Contact Available</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(nonTeachingStaff.map(s => s.session)).size}
              </div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}