// pages/public/administration/GoverningBodyPage.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsersRound, Phone, MapPin, Award, Calendar, Crown, Shield, Star, Users } from "lucide-react";
import { useGetPublicCommitteeQuery } from "@/features/apis/directoryApi";

export default function GoverningBodyPage() {
  const [session, setSession] = useState("");
  const { data, isLoading } = useGetPublicCommitteeQuery({ session });
  const committee = data?.committee || [];

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
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

  const getDesignationIcon = (designation) => {
    const icons = {
      chairman: Crown,
      secretary: Shield,
      treasurer: Award,
      principal: Star,
      member: UsersRound
    };
    return icons[designation] || UsersRound;
  };

  // Sort members by order
  const sortedCommittee = [...committee].sort((a, b) => a.order - b.order);

  // Separate leadership and members
  const leadership = sortedCommittee.filter(m => m.designation !== 'member');
  const members = sortedCommittee.filter(m => m.designation === 'member');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Session Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Governing Body</h1>
          <p className="text-lg text-gray-600">
            Meet the dedicated individuals who guide our institution towards excellence
          </p>
        </div>
        
        {/* Session Filter - Top Right */}
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

      {/* Stats */}
      {sortedCommittee.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{sortedCommittee.length}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{leadership.length}</div>
            <div className="text-sm text-gray-600">Leadership Positions</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-600">{members.length}</div>
            <div className="text-sm text-gray-600">Committee Members</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(sortedCommittee.map(m => m.session)).size}
            </div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
        </div>
      )}

      {sortedCommittee.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <UsersRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {session ? `No committee members found for session ${session}` : "No committee members found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Leadership Team */}
          {leadership.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Leadership Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {leadership.map((member) => {
                  const Icon = getDesignationIcon(member.designation);
                  return (
                    <Card 
                      key={member._id} 
                      className="border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                      <div className="relative">
                        <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                          <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                              {member.name.charAt(0)}
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="pt-12 pb-4 px-4 text-center">
                        <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                        <div className="flex items-center justify-center gap-1 text-blue-600 font-medium text-sm mb-3">
                          <Icon className="w-4 h-4" />
                          <span>{getDesignationLabel(member.designation)}</span>
                        </div>
                        {member.phoneNumber && (
                          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>{member.phoneNumber}</span>
                          </div>
                        )}
                        {member.address && (
                          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{member.address}</span>
                          </div>
                        )}
                        <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                          Session: {member.session}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Committee Members */}
          {members.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Committee Members</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {members.map((member) => (
                  <Card 
                    key={member._id} 
                    className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center"
                  >
                    <CardContent className="p-6">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xl font-bold mb-3">
                        {member.name.charAt(0)}
                      </div>
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      <div className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-1 rounded-full inline-block">
                        Session: {member.session}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}