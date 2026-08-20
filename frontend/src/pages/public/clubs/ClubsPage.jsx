// pages/public/clubs/ClubsPage.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Club, Users, Calendar, Clock, MapPin, User, Sparkles, Mic, FlaskConical, GitBranch, Filter, GraduationCap, Palette, Cpu, Award } from "lucide-react";
import { useGetPublicClubsQuery } from "@/features/apis/directoryApi";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    { value: "all", label: "All Clubs", icon: Club, color: "blue", bgClass: "bg-blue-600 hover:bg-blue-700", textClass: "text-white" },
    { value: "cultural", label: "Cultural", icon: Sparkles, color: "amber", bgClass: "bg-amber-600 hover:bg-amber-700", textClass: "text-white" },
    { value: "science", label: "Science", icon: FlaskConical, color: "green", bgClass: "bg-green-600 hover:bg-green-700", textClass: "text-white" },
    { value: "language", label: "Language", icon: Mic, color: "purple", bgClass: "bg-purple-600 hover:bg-purple-700", textClass: "text-white" },
    { value: "debate", label: "Debate", icon: GitBranch, color: "red", bgClass: "bg-red-600 hover:bg-red-700", textClass: "text-white" },
    { value: "sports", label: "Sports", icon: Award, color: "orange", bgClass: "bg-orange-600 hover:bg-orange-700", textClass: "text-white" },
    { value: "arts", label: "Arts", icon: Palette, color: "pink", bgClass: "bg-pink-600 hover:bg-pink-700", textClass: "text-white" },
    { value: "technology", label: "Technology", icon: Cpu, color: "indigo", bgClass: "bg-indigo-600 hover:bg-indigo-700", textClass: "text-white" },
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
      sports: Award,
      arts: Palette,
      technology: Cpu,
    };
    return icons[type] || Club;
  };

  const getClubTypeColor = (type) => {
    const colors = {
      cultural: "bg-amber-100 text-amber-700 border-amber-200",
      science: "bg-green-100 text-green-700 border-green-200",
      language: "bg-purple-100 text-purple-700 border-purple-200",
      debate: "bg-red-100 text-red-700 border-red-200",
      sports: "bg-orange-100 text-orange-700 border-orange-200",
      arts: "bg-pink-100 text-pink-700 border-pink-200",
      technology: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return colors[type] || "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getClubTypeBg = (type) => {
    const colors = {
      cultural: "from-amber-500 to-orange-500",
      science: "from-green-500 to-emerald-500",
      language: "from-purple-500 to-violet-500",
      debate: "from-red-500 to-rose-500",
      sports: "from-orange-500 to-yellow-500",
      arts: "from-pink-500 to-rose-500",
      technology: "from-indigo-500 to-blue-500",
    };
    return colors[type] || "from-blue-500 to-indigo-500";
  };

  const filteredClubs = clubType === "all"
    ? clubs
    : clubs.filter(club => club.type?.toLowerCase() === clubType);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">School Clubs</h1>
        <p className="text-lg text-gray-600">Explore student clubs and extracurricular activities</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <Club className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{filteredClubs.length} Active Clubs</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {filteredClubs.reduce((sum, club) => sum + (club.members?.length || 0), 0)} Members
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        {clubTypes.map((type) => {
          const Icon = type.icon;
          const isActive = clubType === type.value;
          return (
            <Button
              key={type.value}
              variant={isActive ? "default" : "outline"}
              className={`flex items-center gap-2 rounded-full px-4 ${isActive
                ? `${type.bgClass} ${type.textClass}`
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              onClick={() => setClubType(type.value)}
            >
              <Icon className="w-4 h-4" />
              <span>{type.label}</span>
            </Button>
          );
        })}
      </div>
      {/* Session Filter */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Select value={session ?? "all"} onValueChange={(value) => setSession(value == "all" ? undefined : value)}>
            <SelectTrigger className="w-44 border-0 bg-transparent text-gray-700 focus:ring-0">
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
      </div>

      {filteredClubs.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Club className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
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
          <div className="flex justify-between items-center mb-6">
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
                className="text-gray-500 hover:text-gray-700"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const Icon = getClubTypeIcon(club.type);
              const colorClass = getClubTypeColor(club.type);
              const gradientBg = getClubTypeBg(club.type);

              return (
                <Card
                  key={club._id}
                  className="border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                >
                  <div className="relative">
                    <div className={`h-24 bg-gradient-to-r ${gradientBg}`}></div>
                    <div className="absolute -bottom-10 left-6">
                      <div className={`w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className={colorClass}>
                        {club.type || 'General'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="pt-12 pb-4 px-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{club.clubName}</h3>
                    <p className="text-sm text-gray-500">Session: {club.session}</p>

                    {/* Supervisor */}
                    {club.supervisor?.user?.name && (
                      <div className="mt-3 flex items-center gap-2 text-gray-600 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>Supervisor: {club.supervisor.user.name}</span>
                      </div>
                    )}

                    {/* Description */}
                    {club.description && (
                      <p className="mt-3 text-gray-600 text-sm line-clamp-3">
                        {club.description}
                      </p>
                    )}

                    {/* Divider */}
                    <div className="my-3 border-t border-gray-100"></div>

                    {/* Meeting Schedule */}
                    {club.meetingSchedule && (club.meetingSchedule.day || club.meetingSchedule.time || club.meetingSchedule.venue) && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Schedule</p>
                        {club.meetingSchedule.day && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{club.meetingSchedule.day}</span>
                          </div>
                        )}
                        {club.meetingSchedule.time && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{club.meetingSchedule.time}</span>
                          </div>
                        )}
                        {club.meetingSchedule.venue && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{club.meetingSchedule.venue}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Members */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {club.members?.length || 0} Members
                        </span>
                      </div>
                      {club.members && club.members.length > 0 && (
                        <div className="flex -space-x-2">
                          {club.members.slice(0, 5).map((member, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-medium border-2 border-white"
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">{filteredClubs.length}</div>
              <div className="text-sm text-gray-600">Active Clubs</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <div className="text-2xl font-bold text-green-600">
                {filteredClubs.reduce((sum, club) => sum + (club.members?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(filteredClubs.map(c => c.supervisor?._id)).size}
              </div>
              <div className="text-sm text-gray-600">Supervisors</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">
                {filteredClubs.filter(c => c.meetingSchedule && (c.meetingSchedule.day || c.meetingSchedule.time)).length}
              </div>
              <div className="text-sm text-gray-600">Regular Meetings</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
              <div className="text-2xl font-bold text-indigo-600">
                {new Set(filteredClubs.map(c => c.session)).size}
              </div>
              <div className="text-sm text-gray-600">Active Sessions</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}