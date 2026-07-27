// pages/public/directory/ClubsTab.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Users, Calendar, Clock, MapPin, User } from "lucide-react";
import { useGetPublicClubsQuery } from "@/features/apis/directoryApi";
import { Link } from "react-router-dom";

export default function ClubsTab() {
    const [session, setSession] = useState("");

    const { data, isLoading } = useGetPublicClubsQuery({ session });
    const clubs = data?.clubs || [];

    const currentYear = new Date().getFullYear();
    const sessionOptions = [
        `${currentYear - 2}-${currentYear - 1}`,
        `${currentYear - 1}-${currentYear}`,
        `${currentYear}-${currentYear + 1}`,
        `${currentYear + 1}-${currentYear + 2}`
    ];

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">Loading clubs information...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">School Clubs</h2>
                            <p className="text-gray-600">Explore student clubs and extracurricular activities</p>
                        </div>
                        <Select
                            value={session ?? "all"}
                            onValueChange={(value) =>
                                setSession(value === "all" ? undefined : value)
                            }
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select Session" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sessions</SelectItem>

                                {sessionOptions.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>
                </CardContent>
            </Card>

            {/* Clubs Grid */}
            {clubs.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">
                            {session
                                ? `No clubs found for session ${session}`
                                : "No clubs found."
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map((club) => (
                        <Card key={club._id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                            <CardContent className="p-6 flex-1 flex flex-col">
                                {/* Club Header */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{club.clubName}</h3>
                                            <div className="text-sm text-gray-600">
                                                Session: {club.session}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supervisor */}
                                    {club.supervisor?.user?.name && (
                                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm">Supervisor: {club.supervisor.user.name}</span>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {club.description && (
                                        <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                                            {club.description}
                                        </p>
                                    )}
                                </div>

                                {/* Meeting Schedule */}
                                {club.meetingSchedule && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-2">Meeting Schedule</h4>
                                        <div className="space-y-2">
                                            {club.meetingSchedule.day && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span>{club.meetingSchedule.day}</span>
                                                </div>
                                            )}
                                            {club.meetingSchedule.time && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                    <span>{club.meetingSchedule.time}</span>
                                                </div>
                                            )}
                                            {club.meetingSchedule.venue && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="w-4 h-4 text-gray-500" />
                                                    <span>{club.meetingSchedule.venue}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Members */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {club.members?.length || 0} Members
                                        </span>
                                    </div>
                                    {club.members && club.members.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {club.members.slice(0, 5).map((member, index) => (
                                                <div
                                                    key={index}
                                                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                                                    title={member.student?.name}
                                                >
                                                    {member.student?.name?.charAt(0) || '?'}
                                                </div>
                                            ))}
                                            {club.members.length > 5 && (
                                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                                                    +{club.members.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-4 border-t">
                                    <Button asChild className="w-full">
                                        <Link to={`/clubs/${club._id}`}>
                                            View Club Details
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Statistics */}
            {clubs.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {clubs.length}
                                </div>
                                <div className="text-sm text-gray-600">Active Clubs</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {clubs.reduce((sum, club) => sum + (club.members?.length || 0), 0)}
                                </div>
                                <div className="text-sm text-gray-600">Total Members</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                    {new Set(clubs.map(c => c.supervisor?._id)).size}
                                </div>
                                <div className="text-sm text-gray-600">Supervisors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {clubs.filter(c => c.meetingSchedule).length}
                                </div>
                                <div className="text-sm text-gray-600">Regular Meetings</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}