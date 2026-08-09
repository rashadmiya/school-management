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
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Mail, Phone, Search, User, Users, X } from "lucide-react";
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
    limit: 20,
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Our Teaching Staff</h1>
        <p className="text-gray-600 mt-1">Dedicated educators committed to excellence</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {data?.total || 0} Teachers
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            {designations.length} Roles
          </span>
        </div>
      </div>

      {/* Compact Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
            <SelectTrigger className="w-36 h-9 bg-white border-gray-200 text-gray-900">
              <SelectValue placeholder="Role" />
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
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Search
          </Button>

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-9 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">
          {data?.total || 0} teachers found
        </p>
        {hasFilters && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Filtered
          </span>
        )}
      </div>

      {/* Custom Table - No DataTable component */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-[70px]">Photo</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Information</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No teachers found
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        {row.photo ? (
                          <img
                            src={`${backend_url}${row.photo}`}
                            alt={row.user?.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || '')}&background=6366f1&color=fff&size=40`;
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {row.user?.name}
                            {row.designation && (
                              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50 px-2 py-0">
                                {row.designation}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {row.user?.email}
                          </div>
                          {row.phoneNumber && (
                            <div className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {row.phoneNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {row.lastQualification?.name ? (
                          <div>
                            <div className="text-sm font-medium text-gray-800">
                              {row.lastQualification.name}
                            </div>
                            {row.lastQualification.major && (
                              <div className="text-xs text-gray-500">
                                {row.lastQualification.major}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {row.subjects?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.subjects.slice(0, 2).map((subject) => (
                              <Badge key={subject._id} variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 px-2 py-0">
                                {subject.name}
                              </Badge>
                            ))}
                            {row.subjects.length > 2 && (
                              <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 bg-gray-50 px-2 py-0">
                                +{row.subjects.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data?.total || 0)} of {data?.total || 0}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="h-8 w-8 p-0 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (data?.pages || 1)}
                  className="h-8 w-8 p-0 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}