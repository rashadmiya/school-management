// pages/public/administration/GoverningBodyPage.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsersRound, Phone, MapPin, Award, Calendar, Crown, Shield, Star } from "lucide-react";
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Governing Body</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Meet the dedicated individuals who guide our institution towards excellence
        </p>
      </div>

      {/* Session Filter */}
      <div className="max-w-xs mx-auto mb-8">
        <Select value={session ?? "all"} onValueChange={(value) => setSession(value == "all" ? undefined : value)}>
          <SelectTrigger>
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

      {sortedCommittee.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersRound className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">
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
                    <Card key={member._id} className="hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
                      <CardContent className="p-6 text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                          {member.name.charAt(0)}
                        </div>
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
                            <span className="truncate">{member.address}</span>
                          </div>
                        )}
                        <div className="mt-3 text-xs text-gray-500">
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {members.map((member) => (
                  <Card key={member._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mb-2">
                        {member.name.charAt(0)}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">{member.name}</h4>
                      <div className="text-xs text-gray-500 mt-1">
                        Session: {member.session}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sortedCommittee.length}</div>
                  <div className="text-sm text-gray-600">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{leadership.length}</div>
                  <div className="text-sm text-gray-600">Leadership Positions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{members.length}</div>
                  <div className="text-sm text-gray-600">Committee Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(sortedCommittee.map(m => m.session)).size}
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