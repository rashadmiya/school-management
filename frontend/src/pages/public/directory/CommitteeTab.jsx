// pages/public/directory/CommitteeTab.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MapPin, Award, Calendar } from "lucide-react";
import { useGetPublicCommitteeQuery } from "@/features/apis/directoryApi";
import { Link } from "react-router-dom";

export default function CommitteeTab() {
  const [session, setSession] = useState("");

  const { data, isLoading } = useGetPublicCommitteeQuery({ session });
  const committee = data?.committee || [];
  console.log("comittee data :", data)

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading committee information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">School Management Committee</h3>
              <p className="text-gray-600">Governing body of the school</p>
            </div>
            <Select value={session ?? "all"} onValueChange={(value) => setSession(value == "all" ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessionOptions.map(session => (
                  <SelectItem key={session} value={session}>{session}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Committee List */}
      {committee.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">
              {session
                ? `No committee members found for session ${session}`
                : "No committee members found."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...committee]
            .sort((a, b) => a.order - b.order)
            .map((member) => (
              <Card key={member._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Photo */}
                        <div className="flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                              <Award className="w-8 h-8 text-purple-600" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mt-1">
                                {getDesignationLabel(member.designation)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">{member.session}</span>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1 text-gray-600">
                            {member.phoneNumber && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{member.phoneNumber}</span>
                              </div>
                            )}

                            {member.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                                <span className="text-sm">{member.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Button */}
                    <div className="flex-shrink-0">
                      <Button asChild variant="outline">
                        <Link to={`/committee/${member._id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Committee Structure Info */}
      {committee.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Committee Structure</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {committee
                .filter(m => m.designation !== 'member')
                .map((member) => (
                  <div key={member._id} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-600">
                      {getDesignationLabel(member.designation)}
                    </div>
                    <div className="font-semibold mt-1">{member.name}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}