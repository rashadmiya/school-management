// pages/public/administration/TeachersListPage.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import { backend_url } from "@/utils/server";
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Mail, Phone, Search, User, Users, X, Calendar, MapPin, Award, Clock } from "lucide-react";
import { useState } from "react";

export default function TeachersListPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("all");
  const [searchParams, setSearchParams] = useState({});

  const {
    data,
    isLoading,
    isFetching,
    refetch
  } = useGetTeachersQuery({
    page,
    limit: 12,
    ...searchParams
  });

  const { data: classData } = useGetClassesQuery();
  const classes = classData?.classes || [];

  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects = subjectsData?.subjects || [];

  // Get unique designations for filter
  const designations = [...new Set((data?.docs || []).map(t => t.designation).filter(Boolean))];

  const handleSearch = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedDesignation && selectedDesignation !== "all") params.designation = selectedDesignation;
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDesignation("all");
    setSearchParams({});
    setPage(1);
  };

  const hasFilters = searchTerm || (selectedDesignation && selectedDesignation !== "all");

  const tableData = data?.docs || [];

  // Loading state
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
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Our Teaching Staff</h1>
        <p className="text-lg text-gray-600">Dedicated educators committed to shaping the future</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{data?.total || 0} Teachers</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{designations.length} Roles</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, subject, or qualification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-11 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 rounded-xl"
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
            <SelectTrigger className="w-40 h-11 bg-white border-gray-200 text-gray-900 rounded-xl">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {designations.map((designation) => (
                <SelectItem key={designation} value={designation}>
                  {designation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSearch}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            Search
          </Button>

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-11 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">
          Showing {tableData.length} of {data?.total || 0} teachers
        </p>
        {hasFilters && (
          <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Filtered
          </span>
        )}
      </div>

      {/* Teacher Cards Grid */}
      {tableData.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No teachers found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tableData.map((teacher) => (
            <Card 
              key={teacher._id} 
              className="border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
            >
              <div className="relative">
                {/* Cover gradient */}
                <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                
                {/* Avatar */}
                <div className="absolute -bottom-10 left-6">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                    {teacher.photo ? (
                      <img
                        src={`${backend_url}${teacher.photo}`}
                        alt={teacher.user?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.user?.name || '')}&background=6366f1&color=fff&size=80`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="pt-12 pb-4 px-6">
                {/* Teacher Name & Designation */}
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{teacher.user?.name}</h3>
                  {teacher.designation && (
                    <Badge className="mt-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                      {teacher.designation}
                    </Badge>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {teacher.user?.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{teacher.user.email}</span>
                    </div>
                  )}
                  {teacher.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{teacher.phoneNumber}</span>
                    </div>
                  )}
                  {teacher.joiningDate && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs">Joined {new Date(teacher.joiningDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-gray-100"></div>

                {/* Qualification */}
                <div className="mb-3">
                  {teacher.lastQualification?.name ? (
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{teacher.lastQualification.name}</p>
                        {teacher.lastQualification.major && (
                          <p className="text-xs text-gray-500">{teacher.lastQualification.major}</p>
                        )}
                        {teacher.lastQualification.institute && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {teacher.lastQualification.institute}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No qualification listed</p>
                  )}
                </div>

                {/* Subjects */}
                {teacher.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.slice(0, 3).map((subject) => (
                      <Badge 
                        key={subject._id} 
                        variant="outline" 
                        className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50"
                      >
                        {subject.name}
                      </Badge>
                    ))}
                    {teacher.subjects.length > 3 && (
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 bg-gray-50">
                        +{teacher.subjects.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Subject count badge */}
                {teacher.subjects?.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{teacher.subjects.length} subject{teacher.subjects.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.total > 12 && (
        <div className="flex items-center justify-between mt-8 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, data?.total || 0)} of {data?.total || 0} teachers
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="h-9 w-9 p-0 border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= (data?.pages || 1)}
              className="h-9 w-9 p-0 border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}