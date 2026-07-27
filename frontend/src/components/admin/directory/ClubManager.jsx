// components/admin/directory/ClubManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetClubsQuery } from "@/features/apis/directoryApi";
import { handleApiError } from "@/utils/handleApiErrors";
import { BookOpen, Calendar, Clock, Edit, Filter, MapPin, Plus, Search, Trash2, Users, X } from "lucide-react";
import { useState } from "react";
import ClubForm from "./components/ClubForm";


// Mock API hook
const useClubData = () => {
  const [clubList, setClubList] = useState([
    {
      _id: "1",
      clubName: "Science Club",
      supervisor: { _id: "1", name: "Dr. Smith", user: { name: "Dr. John Smith" } },
      session: "2024-2025",
      description: "Exploring the wonders of science through experiments and projects.",
      members: [
        { student: { _id: "1", name: "Alice" }, role: "president", joinedDate: "2024-01-15" },
        { student: { _id: "2", name: "Bob" }, role: "vice_president", joinedDate: "2024-01-15" },
      ],
      meetingSchedule: {
        day: "Tuesday",
        time: "3:00 PM",
        venue: "Science Lab"
      },
      isActive: true
    },
    {
      _id: "2",
      clubName: "Debate Club",
      supervisor: { _id: "2", name: "Mrs. Johnson", user: { name: "Mrs. Sarah Johnson" } },
      session: "2024-2025",
      description: "Developing public speaking and critical thinking skills.",
      members: [
        { student: { _id: "3", name: "Charlie" }, role: "president", joinedDate: "2024-01-20" },
      ],
      meetingSchedule: {
        day: "Thursday",
        time: "4:00 PM",
        venue: "Auditorium"
      },
      isActive: true
    }
  ]);

  return {
    data: { clubs: clubList },
    isLoading: false,
    refetch: () => { }
  };
};

export default function ClubManager({ teachers = [], students = [] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    session: "",
    supervisor: "",
    isActive: "",
    page: 1,
    limit: 20
  });

  const { data, isLoading } = useGetClubsQuery();
  const clubs = data?.clubs || [];

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      toast.success("Club deleted successfully");
    } catch (err) {
      handleApiError(err || "Failed to delete club");
    }
  };

  const handleEdit = (club) => {
    setEditingClub(club);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingClub(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingClub(null);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      session: "",
      supervisor: "",
      isActive: "",
      page: 1,
      limit: 20
    });
  };

  const hasActiveFilters = filters.search || filters.session || filters.supervisor || filters.isActive;

  // Get unique sessions and supervisors
  const sessions = [...new Set(clubs.map(c => c.session))].filter(Boolean);
  const supervisors = [...new Set(clubs.map(c => c.supervisor?._id))].filter(Boolean);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading clubs data...</div>
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
              <CardTitle className="text-2xl">Clubs Management</CardTitle>
              <p className="text-gray-600">
                Manage school clubs, supervisors, and memberships
              </p>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Club
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
                  placeholder="Search clubs..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
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

            {/* Supervisor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor</label>
              <Select value={filters.supervisor ?? "all"}
                onValueChange={(value) => updateFilter('supervisor', value == "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All supervisors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Supervisors</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.user?.name || teacher.name}
                    </SelectItem>
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

      {/* Clubs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club Name</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Meeting Schedule</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No clubs match your filters" : "No clubs found. Create your first club to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                clubs.map((club) => (
                  <TableRow key={club._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{club.clubName}</div>
                          {club.description && (
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                              {club.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {club.supervisor?.user?.name || club.supervisor?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {club.members?.length || 0} members
                        </Badge>
                        {club.members?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {club.members.filter(m => m.role === 'president').length > 0 ? "✓ President" : ""}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {club.meetingSchedule ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {club.meetingSchedule.day}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {club.meetingSchedule.time}
                            {club.meetingSchedule.venue && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="w-3 h-3" />
                                {club.meetingSchedule.venue}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not scheduled</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {club.session}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={club.isActive ? "default" : "outline"}>
                        {club.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(club)}
                          className="flex items-center gap-1 h-8 px-2"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(club._id, club.clubName)}
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

      {/* Club Form Dialog */}
      <ClubForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingClub}
        teachers={teachers}
        students={students}
      />
    </div>
  );
}