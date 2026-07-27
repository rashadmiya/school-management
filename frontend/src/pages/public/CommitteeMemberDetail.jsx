// components/public/committee/CommitteeMemberDetail.jsx
import { useParams } from "react-router-dom";
import { useGetCommitteeByIdQuery } from "@/features/apis/directoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, Award, Calendar, Quote, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function CommitteeMemberDetail() {
  const { id } = useParams();
  const { data, isLoading } = useGetCommitteeByIdQuery(id);
  const member = data?.committee;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Member Not Found</h2>
        <Button asChild>
          <Link to="/directory">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Committee
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/committee">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Committee
        </Link>
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Photo and Basic Info */}
            <div className="lg:w-1/3">
              <Avatar className="h-48 w-48 mx-auto border-4 border-blue-100">
                <AvatarImage src={member.photo} alt={member.name} />
                <AvatarFallback className="text-4xl bg-blue-100 text-blue-800">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center mt-6">
                <h1 className="text-2xl font-bold">{member.name}</h1>
                <Badge className="mt-2 text-lg px-4 py-1">
                  {member.designation.charAt(0).toUpperCase() + member.designation.slice(1)}
                </Badge>
                
                <div className="mt-4 space-y-2 text-gray-600">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Session: {member.session}</span>
                  </div>
                  
                  {member.religion && (
                    <div className="flex items-center justify-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>{member.religion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:w-2/3">
              {/* Quote Section */}
              {member.quote && (
                <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                  <div className="flex gap-3">
                    <Quote className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-2">Inspirational Quote</h3>
                      <p className="text-lg italic text-gray-700">"{member.quote}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {member.phoneNumber && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{member.phoneNumber}</div>
                      </div>
                    </div>
                  )}
                  
                  {member.address && (
                    <div className="md:col-span-2 flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="font-medium">{member.address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Member Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Status</div>
                    <div className="font-medium">
                      {member.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Display Order</div>
                    <div className="font-medium">{member.order}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}