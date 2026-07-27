// components/student/StudentSearchBar.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

export default function StudentSearchBar({
  onSearch,
  classes = [],
  sessions = [],
  isLoading = false
}) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    session: "",
    religion: "",
    classId: "",
    isPhysicallyDisabled: "",
    gender: ""
  });

  const handleSearch = () => {
    onSearch({
      search: searchTerm,
      ...(isAdvanced ? filters : {})
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilters({
      session: "",
      religion: "",
      classId: "",
      isPhysicallyDisabled: "",
      gender: ""
    });
    onSearch({});
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Basic Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, roll number, or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsAdvanced(!isAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Advanced
        </Button>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Advanced Filters */}
      {isAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50">
          {/* Session Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session</label>
            <Select
              value={filters.session ?? "all"}
              onValueChange={(value) => handleFilterChange('session', value == "all"? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((session) => (
                  <SelectItem key={session} value={session}>
                    {session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Religion Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Religion</label>
            <Input
              placeholder="Religion..."
              value={filters.religion}
              onChange={(e) => handleFilterChange('religion', e.target.value)}
            />
          </div>

          {/* Class Filter */}
          {classes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select
                value={filters.classId ?? "all"}
                onValueChange={(value) => handleFilterChange('classId', value == "all"? undefined : value)}
              >
                <SelectTrigger>
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
            </div>
          )}

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select
              value={filters.gender ?? "all"}
              onValueChange={(value) => handleFilterChange('gender', value == "all"? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photo filtering</label>
            <Select
              value={filters.hasPhoto ?? "all"}
              onValueChange={(value) => handleFilterChange('hasPhoto', value == "all"? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="true">With Photo</SelectItem>
                <SelectItem value="false">Without Photo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Disability Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Disability Status</label>
            <Select
              value={filters.isPhysicallyDisabled ?? "all"}
              onValueChange={(value) => handleFilterChange('isPhysicallyDisabled', value == "all"? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="true">With Disability</SelectItem>
                <SelectItem value="false">Without Disability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}