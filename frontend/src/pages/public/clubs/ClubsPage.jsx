// pages/public/clubs/ClubsPage.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Club, Users, Calendar, Clock, MapPin, User, Sparkles, Flame, Mic, FlaskConical, GitBranch, Filter } from "lucide-react";
import { useGetPublicClubsQuery } from "@/features/apis/directoryApi";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ClubsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  
  const [session, setSession] = useState("");
  const [clubType, setClubType] = useState(typeParam || "all");
  
  const { data, isLoading } = useGetPublicClubsQuery({ session });
  const clubs = data?.clubs || [];

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const clubTypes = [
    { value: "all", label: "All Clubs", icon: Club, color: "blue" },
    { value: "cultural", label: "Cultural Clubs", icon: Sparkles, color: "orange" },
    { value: "science", label: "Science Club", icon: FlaskConical, color: "green" },
    { value: "language", label: "Language Club", icon: Mic, color: "purple" },
    { value: "debate", label: "Debate Club", icon: GitBranch, color: "red" },
  ];

  // Update URL when club type changes
  useEffect(() => {
    if (clubType === "all") {
      searchParams.delete('type');
    } else {
      searchParams.set('type', clubType);
    }
    setSearchParams(searchParams);
  }, [clubType, setSearchParams, searchParams]);

  const getClubTypeIcon = (type) => {
    const icons = {
      cultural: Sparkles,
      science: FlaskConical,
      language: Mic,
      debate: GitBranch,
    };
    return icons[type] || Club;
  };

  const getClubTypeColor = (type) => {
    const colors = {
      cultural: "bg-orange-100 text-orange-600",
      science: "bg-green-100 text-green-600",
      language: "bg-purple-100 text-purple-600",
      debate: "bg-red-100 text-red-600",
    };
    return colors[type] || "bg-blue-100 text-blue-600";
  };

  const filteredClubs = clubType === "all" 
    ? clubs 
    : clubs.filter(club => club.type?.toLowerCase() === clubType);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">School Clubs</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore student clubs and extracurricular activities
        </p>
      </div>

      {/* Club Type Filter - Quick Navigation */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {clubTypes.map((type) => {
          const Icon = type.icon;
          const isActive = clubType === type.value;
          return (
            <Button
              key={type.value}
              variant={isActive ? "default" : "outline"}
              className={`flex items-center gap-2 ${
                isActive ? `bg-${type.color}-600 hover:bg-${type.color}-700` : ''
              }`}
              onClick={() => setClubType(type.value)}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{type.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Session Filter */}
      <div className="flex justify-center mb-8">
        <Select value={session ?? "all"} onValueChange={(value) => setSession(value == "all" ? undefined : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessionOptions.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredClubs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Club className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">
              {session 
                ? `No clubs found for session ${session}` 
                : clubType !== "all" 
                  ? `No ${clubType} clubs found`
                  : "No clubs found."}
            </p>
            {(session || clubType !== "all") && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSession("");
                  setClubType("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              Showing {filteredClubs.length} {clubType !== "all" ? clubType : ""} club{filteredClubs.length > 1 ? 's' : ''}
              {session && ` for session ${session}`}
            </p>
            {(session || clubType !== "all") && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSession("");
                  setClubType("all");
                }}
                className="text-gray-500"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const Icon = getClubTypeIcon(club.type);
              const colorClass = getClubTypeColor(club.type);
              return (
                <Card key={club._id} className="overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    {/* Club Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{club.clubName}</h3>
                          <div className="text-sm text-gray-500">
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
                    <div className="mt-auto">
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
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stats */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredClubs.length}</div>
                  <div className="text-sm text-gray-600">Active Clubs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredClubs.reduce((sum, club) => sum + (club.members?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(filteredClubs.map(c => c.supervisor?._id)).size}
                  </div>
                  <div className="text-sm text-gray-600">Supervisors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredClubs.filter(c => c.meetingSchedule).length}
                  </div>
                  <div className="text-sm text-gray-600">Regular Meetings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {new Set(filteredClubs.map(c => c.session)).size}
                  </div>
                  <div className="text-sm text-gray-600">Active Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}