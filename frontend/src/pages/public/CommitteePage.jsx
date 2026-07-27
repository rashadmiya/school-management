// components/public/committee/CommitteePage.jsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MapPin, Award, Calendar, Quote, Users, Filter, ArrowLeft, ArrowRight } from "lucide-react";
import { useGetPublicCommitteeQuery } from "@/features/apis/directoryApi";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function CommitteePage() {
  const [session, setSession] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading } = useGetPublicCommitteeQuery({ session });
  const committee = data?.committee || [];

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear-2}-${currentYear-1}`,
    `${currentYear-1}-${currentYear}`,
    `${currentYear}-${currentYear+1}`,
    `${currentYear+1}-${currentYear+2}`
  ];

  const getDesignationLabel = (designation) => {
    const labels = {
      chairman: "Chairman",
      secretary: "Secretary",
      treasurer: "Treasurer",
      principal: "Principal",
      member: "Member"
    };
    return labels[designation] || designation;
  };

  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter members based on active tab
  const filteredMembers = committee.filter(member => {
    if (activeTab === "with-quotes") {
      return member.quote && member.quote.trim() !== "";
    }
    if (activeTab === "leadership") {
      return ['chairman', 'secretary', 'principal'].includes(member.designation);
    }
    return true;
  });

  // Sort members: leadership first, then alphabetical
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const priorityOrder = ['chairman', 'secretary', 'principal', 'treasurer', 'member'];
    const aPriority = priorityOrder.indexOf(a.designation);
    const bPriority = priorityOrder.indexOf(b.designation);
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.order - b.order || a.name.localeCompare(b.name);
  });

  // Group members by designation
  const groupedMembers = sortedMembers.reduce((groups, member) => {
    const designation = member.designation;
    if (!groups[designation]) {
      groups[designation] = [];
    }
    groups[designation].push(member);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading committee information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">School Management Committee</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Meet the dedicated leadership team guiding our school towards excellence and innovation in education.
        </p>
      </div>

      {/* Controls Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">Committee Members</h3>
                <p className="text-gray-600 text-sm">
                  {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Tabs for filtering */}
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="leadership">Leadership</TabsTrigger>
                  <TabsTrigger value="with-quotes">With Quotes</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Session Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={session || "all"} onValueChange={(value) => setSession(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {sessionOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Committee Members Grid */}
      {sortedMembers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Committee Members Found</h3>
            <p className="text-gray-600">
              {session 
                ? `No committee members found for session ${session}`
                : "Please try a different filter or check back later."
              }
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSession("");
                setActiveTab("all");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Render by designation groups */}
          {Object.entries(groupedMembers).map(([designation, members]) => (
            <div key={designation} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getDesignationLabel(designation)}
                </h2>
                <Badge variant="outline" className="text-sm">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <Card key={member._id} className="hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                    <CardContent className="p-6">
                      {/* Member Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-16 w-16 border-2 border-blue-100">
                          <AvatarImage 
                            src={member.photo} 
                            alt={member.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-800 text-lg font-semibold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{member.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              {getDesignationLabel(member.designation)}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {member.session}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quote Section */}
                      {member.quote && (
                        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                          <div className="flex items-start gap-2">
                            <Quote className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700 italic">
                              "{member.quote}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div className="space-y-2 text-sm text-gray-600">
                        {member.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{member.phoneNumber}</span>
                          </div>
                        )}
                        
                        {member.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{member.address}</span>
                          </div>
                        )}
                        
                        {member.religion && (
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-gray-400" />
                            <span>{member.religion}</span>
                          </div>
                        )}
                      </div>

                      {/* View Details Button */}
                      <div className="mt-4 pt-4 border-t">
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          <Link to={`/committee/${member._id}`}>
                            View Full Profile
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {sortedMembers.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Committee Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {committee.filter(m => ['chairman', 'secretary', 'principal'].includes(m.designation)).length}
                </div>
                <div className="text-sm text-gray-600">Leadership Team</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {committee.filter(m => m.quote && m.quote.trim() !== "").length}
                </div>
                <div className="text-sm text-gray-600">Members with Quotes</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {new Set(committee.map(m => m.session)).size}
                </div>
                <div className="text-sm text-gray-600">Active Sessions</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{committee.length}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to Home Link */}
      <div className="mt-8 text-center">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}