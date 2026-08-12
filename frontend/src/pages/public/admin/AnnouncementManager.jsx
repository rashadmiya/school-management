// components/admin/AnnouncementManager.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Edit, Filter, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import AnnouncementForm from "@/components/Announcement/AnnouncementForm";
import { useDeleteAnnouncementMutation, useGetAdminAnnouncementsQuery, useTogglePinAnnouncementMutation } from "@/features/apis/api";
import { useAppSelector } from "@/features/store";

// Theme hook – can be extracted to a shared location
const useTheme = () => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  return {
    isDarkMode,
    bg: isDarkMode ? "bg-gray-900" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    bgSubtle: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
    tableHeader: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    tableRow: isDarkMode ? "border-gray-800 hover:bg-gray-800/50" : "border-gray-200 hover:bg-gray-50",
    selectTrigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
    selectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
    selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
    button: {
      primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
      outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
      destructive: isDarkMode ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30" : "bg-red-500 text-white hover:bg-red-600",
    },
    badge: {
      draft: isDarkMode ? "border-gray-700 text-gray-400" : "",
      scheduled: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-800",
      expired: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800",
      active: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
      low: isDarkMode ? "border-gray-700 text-gray-300" : "",
      medium: isDarkMode ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" : "border-yellow-200 text-yellow-800 bg-yellow-50",
      high: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
      urgent: isDarkMode ? "bg-red-600/30 text-red-300 border-red-500/50" : "bg-red-200 text-red-900",
    },
    stat: {
      total: isDarkMode ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600",
      active: isDarkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-green-50 text-green-600",
      draft: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-100 text-gray-600",
      pinned: isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 text-yellow-600",
    },
    pinIcon: isDarkMode ? "text-yellow-400 fill-yellow-400" : "text-yellow-600 fill-yellow-600",
  };
};

export default function AnnouncementManager() {
  const theme = useTheme();
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
      return <Badge variant="outline" className={theme.badge.draft}>Draft</Badge>;
    }

    if (startDate > now) {
      return <Badge variant="outline" className={theme.badge.scheduled}>Scheduled</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge variant="outline" className={theme.badge.expired}>Expired</Badge>;
    }

    return <Badge variant="outline" className={theme.badge.active}>Active</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const classes = {
      low: theme.badge.low,
      medium: theme.badge.medium,
      high: theme.badge.high,
      urgent: theme.badge.urgent
    };
    return <Badge variant="outline" className={classes[priority] || ''}>{priority}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
        <CardContent className="p-6">
          <div className={`text-center ${theme.textMuted}`}>Loading announcements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${theme.text}`}>
      {/* Header and Stats */}
      <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className={`text-2xl ${theme.text}`}>Announcement Management</CardTitle>
            <Button onClick={handleAddNew} className={`flex items-center gap-2 ${theme.button.primary}`}>
              <Plus className="w-4 h-4" />
              New Announcement
            </Button>
          </div>
        </CardHeader>

        {/* Statistics */}
        {statistics && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={`${theme.bgSubtle} border ${theme.border}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${theme.stat.total}`}>{statistics.total}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Total</div>
                </CardContent>
              </Card>
              <Card className={`${theme.bgSubtle} border ${theme.border}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${theme.stat.active}`}>{statistics.active}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Active</div>
                </CardContent>
              </Card>
              <Card className={`${theme.bgSubtle} border ${theme.border}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${theme.stat.draft}`}>{statistics.draft}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Draft</div>
                </CardContent>
              </Card>
              <Card className={`${theme.bgSubtle} border ${theme.border}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${theme.stat.pinned}`}>{statistics.pinned}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Pinned</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={`text-sm font-medium ${theme.textSecondary}`}>Filter by:</span>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger className={`w-32 ${theme.selectTrigger}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={theme.selectContent}>
                <SelectItem value="all" className={theme.selectItem}>All Status</SelectItem>
                <SelectItem value="active" className={theme.selectItem}>Active</SelectItem>
                <SelectItem value="upcoming" className={theme.selectItem}>Upcoming</SelectItem>
                <SelectItem value="expired" className={theme.selectItem}>Expired</SelectItem>
                <SelectItem value="draft" className={theme.selectItem}>Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger className={`w-32 ${theme.selectTrigger}`}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className={theme.selectContent}>
                <SelectItem value="all" className={theme.selectItem}>All Categories</SelectItem>
                <SelectItem value="general" className={theme.selectItem}>General</SelectItem>
                <SelectItem value="academic" className={theme.selectItem}>Academic</SelectItem>
                <SelectItem value="event" className={theme.selectItem}>Event</SelectItem>
                <SelectItem value="holiday" className={theme.selectItem}>Holiday</SelectItem>
                <SelectItem value="exam" className={theme.selectItem}>Exam</SelectItem>
                <SelectItem value="sports" className={theme.selectItem}>Sports</SelectItem>
                <SelectItem value="important" className={theme.selectItem}>Important</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Table */}
      <Card className={`${theme.bgCard} ${theme.border} shadow-sm overflow-hidden`}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                <TableRow>
                  <TableHead className={theme.textSecondary}>Title</TableHead>
                  <TableHead className={theme.textSecondary}>Category</TableHead>
                  <TableHead className={theme.textSecondary}>Priority</TableHead>
                  <TableHead className={theme.textSecondary}>Status</TableHead>
                  <TableHead className={theme.textSecondary}>Dates</TableHead>
                  <TableHead className={theme.textSecondary}>Audience</TableHead>
                  <TableHead className={`text-right ${theme.textSecondary}`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.length === 0 ? (
                  <TableRow className={theme.tableRow}>
                    <TableCell colSpan={7} className={`text-center py-8 ${theme.textMuted}`}>
                      No announcements found.
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((announcement) => (
                    <TableRow key={announcement._id} className={`border-b ${theme.tableRow}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {announcement.isPinned && <Pin className={`w-4 h-4 ${theme.pinIcon}`} />}
                          <span className={theme.text}>{announcement.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={theme.badge.low}>{announcement.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(announcement.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(announcement)}
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm ${theme.textMuted}`}>
                          <div>Start: {format(new Date(announcement.startDate), 'MMM dd, yyyy')}</div>
                          {announcement.endDate && (
                            <div>End: {format(new Date(announcement.endDate), 'MMM dd, yyyy')}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {announcement.targetAudience.map(audience => (
                            <Badge key={audience} variant="outline" className={`text-xs ${theme.badge.low}`}>
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
                            className={`flex items-center gap-1 ${theme.button.outline}`}
                          >
                            {announcement.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            {announcement.isPinned ? 'Unpin' : 'Pin'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                            className={`flex items-center gap-1 ${theme.button.outline}`}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(announcement._id, announcement.title)}
                            className={`flex items-center gap-1 ${theme.button.destructive}`}
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
          </div>
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