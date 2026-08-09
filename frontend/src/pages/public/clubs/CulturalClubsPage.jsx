// pages/public/clubs/CulturalClubsPage.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Users, Calendar, MapPin } from "lucide-react";
import { useGetClubsQuery } from "@/features/apis/directoryApi";
// import { useGetCulturalClubsQuery } from "@/features/apis/directoryApi";

export default function CulturalClubsPage() {
//   const { data: clubsData, isLoading } = useGetCulturalClubsQuery();
  const { data: clubsData, isLoading } = useGetClubsQuery();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cultural Clubs</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Celebrate diversity and creativity through our vibrant cultural clubs
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubsData?.clubs?.map((club) => (
            <Card key={club.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Sparkles className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {club.memberCount || 0} Members
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{club.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{club.description}</p>
                {club.teacherInCharge && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>Teacher In-Charge: {club.teacherInCharge}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}