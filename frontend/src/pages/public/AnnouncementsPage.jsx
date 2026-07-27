// pages/public/AnnouncementsPage.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAnnouncementCategoriesQuery, useGetPublicAnnouncementsQuery } from "@/features/apis/publicApi";
import { format } from "date-fns";
import { Calendar, Eye, Pin, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState({
    category: 'all',
    page: 1,
    limit: 10,
    search: ''
  });

  const { data, isLoading, error } = useGetPublicAnnouncementsQuery(filters);
  const { data: categoriesData } = useGetAnnouncementCategoriesQuery();

  const announcements = data?.announcements || [];
  const pagination = data?.pagination;
  const categories = categoriesData?.categories || [];

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {})
    }));
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Failed to load announcements.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Announcements</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Stay updated with the latest news and announcements from our school.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search announcements..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter('category', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      {isLoading ? (
        <div className="text-center py-8">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No announcements found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement._id} className={announcement.isPinned ? 'border-yellow-200 bg-yellow-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.isPinned && (
                        <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      )}
                      <Link 
                        to={`/announcements/${announcement._id}`}
                        className="font-semibold text-lg hover:text-blue-600"
                      >
                        {announcement.title}
                      </Link>
                    </div>
                    
                    {announcement.excerpt && (
                      <p className="text-gray-600 mb-3">{announcement.excerpt}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(announcement.startDate), 'MMM dd, yyyy')}
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {announcement.category}
                      </Badge>
                      
                      {announcement.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Important
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {announcement.views} views
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {announcement.targetAudience.map(audience => (
                        <Badge key={audience} variant="outline" className="text-xs">
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => updateFilter('page', pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <span className="flex items-center px-4">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => updateFilter('page', pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}