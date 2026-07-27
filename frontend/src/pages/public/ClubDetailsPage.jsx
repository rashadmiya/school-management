// components/public/clubs/ClubDetailPage.jsx
import { useParams } from "react-router-dom";
import { useGetClubByIdQuery } from "@/features/apis/directoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  User,
  Crown,
  Award,
  BookOpen,
  Mail,
  Phone,
  CalendarDays,
  CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function ClubDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetClubByIdQuery(id);
  const club = data?.club;

  console.log("club:", club)
  if (isLoading) {
    return <ClubDetailSkeleton />;
  }

  if (error || !club) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error?.data?.message || "Club not found or failed to load"}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/directory">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clubs
          </Link>
        </Button>
      </div>
    );
  }

  // Helper functions
  const getRoleBadge = (role) => {
    const roleConfig = {
      president: { label: "President", variant: "default", icon: Crown },
      vice_president: { label: "Vice President", variant: "secondary", icon: Award },
      member: { label: "Member", variant: "outline", icon: Users }
    };
    return roleConfig[role] || { label: role, variant: "outline", icon: User };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const membersByRole = club.members.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {});

  // Sort roles: president -> vice_president -> member
  const sortedRoles = ['president', 'vice_president', 'member'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/clubs">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Clubs
        </Link>
      </Button>

      {/* Header Section */}
      <Card className="mb-8 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative h-full flex items-center justify-center text-white">
            <div className="text-center p-6">
              <h1 className="text-4xl font-bold mb-2">{club.clubName}</h1>
              <div className="flex items-center justify-center gap-4">
                <Badge className="bg-white text-blue-600 hover:bg-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  Session: {club.session}
                </Badge>
                <Badge className={club.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {club.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Club Description */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  About This Club
                </h2>
                {club.description ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {club.description}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </div>

              {/* Meeting Schedule */}
              {club.meetingSchedule && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    Meeting Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500">Day</div>
                        <div className="font-semibold">{club.meetingSchedule.day}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500">Time</div>
                        <div className="font-semibold">{club.meetingSchedule.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-500">Venue</div>
                        <div className="font-semibold">{club.meetingSchedule.venue}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Club Members Tabs */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Club Members ({club.members.length})
                </h2>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="all">All Members</TabsTrigger>
                    <TabsTrigger value="president">Leadership</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-4">
                    {sortedRoles.map(role => (
                      membersByRole[role]?.map((member, index) => (
                        <MemberCard key={member._id} member={member} index={index} />
                      ))
                    ))}
                  </TabsContent>

                  <TabsContent value="president" className="space-y-4 mt-4">
                    {membersByRole.president?.map((member, index) => (
                      <MemberCard key={member._id} member={member} index={index} />
                    ))}
                    {membersByRole.vice_president?.map((member, index) => (
                      <MemberCard key={member._id} member={member} index={index} />
                    ))}
                  </TabsContent>

                  <TabsContent value="members" className="space-y-4 mt-4">
                    {membersByRole.member?.map((member, index) => (
                      <MemberCard key={member._id} member={member} index={index} />
                    ))}
                  </TabsContent>

                  <TabsContent value="stats" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {membersByRole.president?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Presidents</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {membersByRole.vice_president?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Vice Presidents</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {membersByRole.member?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">Members</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {club.members.length}
                          </div>
                          <div className="text-sm text-gray-600">Total</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Supervisor Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Club Supervisor
                  </h3>
                  {club.supervisor ? (
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-blue-100">
                        <AvatarImage
                          src={club.supervisor.photo}
                          alt={club.supervisor.name}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {club.supervisor.name?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-bold">{club.supervisor.name}</h4>
                        <p className="text-sm text-gray-600">{club.supervisor.designation}</p>
                        <div className="flex gap-2 mt-2">
                          {club.supervisor.email && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`mailto:${club.supervisor.email}`}>
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </a>
                            </Button>
                          )}
                          {club.supervisor.phone && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`tel:${club.supervisor.phone}`}>
                                <Phone className="w-3 h-3 mr-1" />
                                Call
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No supervisor assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Club Info Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Club Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <Badge variant={club.isActive ? "default" : "secondary"}>
                        {club.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : "Inactive"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Members</span>
                      <span className="font-semibold">{club.members.length}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session</span>
                      <span className="font-semibold">{club.session}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Created</span>
                      <span className="font-semibold">
                        {new Date(club.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-semibold">Interested in Joining?</h3>
                  <Button className="w-full" asChild>
                    <Link to={`/clubs/${club._id}/join`}>
                      <Users className="w-4 h-4 mr-2" />
                      Join This Club
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/clubs">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      View All Clubs
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Member Card Component
function MemberCard({ member, index }) {
  const roleConfig = {
    president: { label: "President", variant: "default", icon: Crown },
    vice_president: { label: "Vice President", variant: "secondary", icon: Award },
    member: { label: "Member", variant: "outline", icon: User }
  };

  const config = roleConfig[member.role] || roleConfig.member;

  return (
    <Card key={member._id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-gray-400 font-mono">#{index + 1}</div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.student?.photo} alt={member.student?.name} />
              <AvatarFallback>
                {member.student?.name?.split(' ').map(n => n[0]).join('') || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{member.student?.name || "Unknown Student"}</h4>
              <p className="text-sm text-gray-600">
                {member.student?.classSection ? `Class ${member.student.classSection}` : ""}
                {member.student?.rollNumber ? ` • Roll: ${member.student.rollNumber}` : ""}
              </p>
            </div>
          </div>
          <Badge variant={config.variant}>
            <config.icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Joined: {new Date(member.joinedDate).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Loading Component
function ClubDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-32 mb-6" />
      <Card className="mb-8">
        <div className="h-48 bg-gray-200" />
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}