// components/public/AnnouncementList.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pin, Eye, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useGetPublicAnnouncementsQuery } from "@/features/apis/publicApi";

export default function AnnouncementList({ limit = 5, showViewAll = true }) {
    const { data, isLoading, error } = useGetPublicAnnouncementsQuery({
        limit,
        page: 1
    });

    const announcements = data?.announcements || [];

    if (isLoading) {
        return <div className="text-center py-4">Loading announcements...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Failed to load announcements</div>;
    }

    if (announcements.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-500">
                    No announcements available at the moment.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {announcements.map((announcement) => (
                <Card key={announcement._id} className={announcement.isPinned ? 'border-yellow-200 bg-yellow-50' : ''}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {announcement.isPinned && (
                                        <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                                    )}
                                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                                </div>

                                {announcement.excerpt && (
                                    <p className="text-gray-600 mb-3">{announcement.excerpt}</p>
                                )}

                                <div className="flex items-center gap-4 text-sm text-gray-500">
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
                            </div>

                            <Link
                                to={`/announcements/${announcement._id}`}
                                className="ml-4 text-blue-600 hover:text-blue-800"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {showViewAll && announcements.length > 0 && (
                <div className="text-center">
                    <Link
                        to="/announcements"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        View All Announcements
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}