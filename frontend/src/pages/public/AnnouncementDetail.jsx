// pages/public/AnnouncementDetail.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Eye, Pin, Download } from "lucide-react";
import { format } from "date-fns";
import { useGetPublicAnnouncementQuery } from "@/features/apis/publicApi";

export default function AnnouncementDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetPublicAnnouncementQuery(id);

  const announcement = data?.announcement;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading announcement...</div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Announcement not found.</p>
            <Button asChild className="mt-4">
              <Link to="/announcements">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Announcements
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="outline" asChild className="mb-6">
        <Link to="/announcements">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Announcements
        </Link>
      </Button>

      <Card className={announcement.isPinned ? 'border-yellow-200 bg-yellow-50' : ''}>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              {announcement.isPinned && (
                <Pin className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              )}
              <h1 className="text-3xl font-bold">{announcement.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(announcement.startDate), 'MMMM dd, yyyy')}
              </div>
              
              <Badge variant="outline">{announcement.category}</Badge>
              
              {announcement.priority === 'high' && (
                <Badge variant="destructive">Important</Badge>
              )}
              
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {announcement.views} views
              </div>

              {announcement.createdBy && (
                <div>By {announcement.createdBy.name}</div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {announcement.targetAudience.map(audience => (
                <Badge key={audience} variant="outline" className="text-xs">
                  {audience}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none mb-6"
            dangerouslySetInnerHTML={{ 
              __html: announcement.content.replace(/\n/g, '<br>') 
            }}
          />

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Attachments</h3>
              <div className="space-y-2">
                {announcement.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{file.filename}</div>
                      <div className="text-sm text-gray-500">
                        {file.mimetype} • {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/announcements/public/${announcement._id}/files/${file._id}/download`} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}