// components/admin/AnnouncementManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useDeleteAnnouncementMutation, useGetAdminAnnouncementsQuery, useTogglePinAnnouncementMutation } from "@/features/apis/announcementApi";
import { format } from "date-fns";
import { Edit, Filter, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import AnnouncementForm from "@/components/Announcement/AnnouncementForm";
import { useDeleteAnnouncementMutation, useGetAdminAnnouncementsQuery, useTogglePinAnnouncementMutation } from "@/features/apis/api";

export default function AnnouncementManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    page: 1,
    limit: 20
  });

  const { data, isLoading, refetch } = useGetAdminAnnouncementsQuery(filters);
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [togglePinAnnouncement] = useTogglePinAnnouncementMutation();

  const announcements = data?.announcements || [];
  const statistics = data?.statistics;

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteAnnouncement(id).unwrap();
      toast.success("Announcement deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete announcement");
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await togglePinAnnouncement(id).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to toggle pin status");
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAnnouncement(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAnnouncement(null);
    refetch();
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}) // reset to first page when changing filters
    }));
  };

  const getStatusBadge = (announcement) => {
    const now = new Date();
    const startDate = new Date(announcement.startDate);
    const endDate = announcement.endDate ? new Date(announcement.endDate) : null;

    if (!announcement.isPublished) {
      return <Badge variant="outline">Draft</Badge>;
    }

    if (startDate > now) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expired</Badge>;
    }

    return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: "outline",
      medium: "outline",
      high: "destructive",
      urgent: "destructive"
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading announcements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl">Announcement Management</CardTitle>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Announcement
            </Button>
          </div>
        </CardHeader>

        {/* Statistics */}
        {statistics && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{statistics.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{statistics.draft}</div>
                  <div className="text-sm text-gray-600">Draft</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.pinned}</div>
                  <div className="text-sm text-gray-600">Pinned</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="important">Important</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No announcements found.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => (
                  <TableRow key={announcement._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {announcement.isPinned && <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />}
                        {announcement.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{announcement.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(announcement.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(announcement)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Start: {format(new Date(announcement.startDate), 'MMM dd, yyyy')}</div>
                        {announcement.endDate && (
                          <div>End: {format(new Date(announcement.endDate), 'MMM dd, yyyy')}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {announcement.targetAudience.map(audience => (
                          <Badge key={audience} variant="outline" className="text-xs">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePin(announcement._id)}
                          className="flex items-center gap-1"
                        >
                          {announcement.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                          {announcement.isPinned ? 'Unpin' : 'Pin'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(announcement._id, announcement.title)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
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

      {/* Announcement Form Dialog */}
      <AnnouncementForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        initialData={editingAnnouncement}
      />
    </div>
  );
}