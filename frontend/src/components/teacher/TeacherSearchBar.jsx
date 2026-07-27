import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

export default function TeacherSearchBar({ 
  onSearch, 
  designations = [], 
  classes = [],
  isLoading = false 
}) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    designation: "",
    religion: "",
    hasPhoto: "",
    joiningDateFrom: "",
    joiningDateTo: ""
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
      designation: "",
      religion: "",
      hasPhoto: "",
      joiningDateFrom: "",
      joiningDateTo: ""
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
            placeholder="Search by name, email, or phone..."
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
          {isAdvanced ? "Simple" : "Advanced"}
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
          {/* Designation Filter */}
          {designations.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Designation</label>
              <Select 
                value={filters.designation?? "all"} 
                onValueChange={(value) => handleFilterChange('designation', value == "all"? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {designations.map((designation) => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Religion Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Religion</label>
            <Input
              placeholder="Religion..."
              value={filters.religion}
              onChange={(e) => handleFilterChange('religion', e.target.value)}
            />
          </div>

          {/* Photo Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Photo Status</label>
            <Select 
              value={filters.hasPhoto ?? "all"} 
              onValueChange={(value) => handleFilterChange('hasPhoto', value == "all"? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                <SelectItem value="true">With Photo</SelectItem>
                <SelectItem value="false">Without Photo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Joining Date From */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Joined From</label>
            <Input
              type="date"
              value={filters.joiningDateFrom}
              onChange={(e) => handleFilterChange('joiningDateFrom', e.target.value)}
            />
          </div>

          {/* Joining Date To */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Joined To</label>
            <Input
              type="date"
              value={filters.joiningDateTo}
              onChange={(e) => handleFilterChange('joiningDateTo', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}