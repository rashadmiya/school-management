// pages/public/directory/CabinetTab.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, GraduationCap, Users, Award } from "lucide-react";
import { useGetPublicCabinetQuery } from "@/features/apis/directoryApi";
import { Link } from "react-router-dom";

export default function CabinetTab() {
  const [session, setSession] = useState("");

  const { data, isLoading } = useGetPublicCabinetQuery({ session });
  const cabinet = data?.cabinet || [];

  const currentYear = new Date().getFullYear();
  const sessionOptions = [
    `${currentYear - 2}-${currentYear - 1}`,
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ];

  const getDesignationLabel = (designation) => {
    const labels = {
      president: "President",
      vice_president: "Vice President",
      secretary: "Secretary",
      treasurer: "Treasurer",
      member: "Member"
    };
    return labels[designation] || designation;
  };

  // Group by designation for structure display
  const cabinetStructure = cabinet.reduce((acc, member) => {
    if (!acc[member.designation]) {
      acc[member.designation] = [];
    }
    acc[member.designation].push(member);
    return acc;
  }, {});

  const designationOrder = ['president', 'vice_president', 'secretary', 'treasurer', 'member'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading student cabinet information...</div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Cabinet</h2>
              <p className="text-gray-600">Elected student representatives and leaders</p>
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

      {/* Cabinet Structure */}
      {Object.keys(cabinetStructure).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cabinet Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {designationOrder.map(designation => {
                const members = cabinetStructure[designation];
                if (!members || designation === 'member') return null;

                return (
                  <div key={designation} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="inline-block p-2 bg-blue-100 rounded-full mb-2">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="font-semibold text-gray-900">
                      {getDesignationLabel(designation)}
                    </div>
                    {members.map(member => (
                      <div key={member._id} className="mt-2">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">
                          Class {member.class?.name} • {member.rollNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Cabinet Members */}
      {cabinet.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">
              {session
                ? `No cabinet members found for session ${session}`
                : "No cabinet members found."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...cabinet]
            .sort((a, b) => {
              const order = { president: 1, vice_president: 2, secretary: 3, treasurer: 4, member: 5 };
              return order[a.designation] - order[b.designation];
            })
            .map((member) => (
              <Card key={member._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    {/* Designation Badge */}
                    <div className="mb-4">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${member.designation === 'president'
                        ? 'bg-blue-100 text-blue-800'
                        : member.designation === 'vice_president'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {getDesignationLabel(member.designation)}
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>

                      <div className="space-y-2 text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Class {member.class?.name}</span>
                        </div>

                        {member.section?.name && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Section {member.section.name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>Roll: {member.rollNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Session: {member.session}
                        </span>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/cabinet/${member._id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Statistics */}
      {cabinet.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {cabinet.length} cabinet members for {session || 'all sessions'}
              </div>
              <div className="text-sm">
                <span className="font-medium">
                  {cabinet.filter(m => m.designation !== 'member').length} leadership positions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}