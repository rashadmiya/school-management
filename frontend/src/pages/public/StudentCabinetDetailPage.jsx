// components/public/student-cabinet/StudentCabinetDetailPage.jsx
import { useParams } from "react-router-dom";
import { useGetStudentCabinetByIdQuery } from "@/features/apis/directoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  User, 
  Users, 
  Crown, 
  Award, 
  Book, 
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  Home,
  Heart,
  Shield,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Star,
  BookOpen,
  Building,
  School,
  Mail,
  Cake,
  Clock,
  BadgeCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentCabinetDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetStudentCabinetByIdQuery(id);
  const member = data?.cabinetMember;

  if (isLoading) {
    return <StudentCabinetDetailSkeleton />;
  }

  if (error || !member) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error?.data?.message || "Cabinet member not found or failed to load"}
          </AlertDescription>
        </Alert>
        <Button asChild>
          {/* <Link to="/student-cabinet"> */}
          <Link to="/cabinet">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Student Cabinet
          </Link>
        </Button>
      </div>
    );
  }

  // Helper functions
  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDesignationConfig = (designation) => {
    const configs = {
      president: {
        label: "President",
        icon: Crown,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        description: "Head of the student cabinet"
      },
      vice_president: {
        label: "Vice President",
        icon: Award,
        color: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Assists the president"
      },
      secretary: {
        label: "Secretary",
        icon: Book,
        color: "bg-green-100 text-green-800 border-green-200",
        description: "Manages documentation"
      },
      treasurer: {
        label: "Treasurer",
        icon: Shield,
        color: "bg-purple-100 text-purple-800 border-purple-200",
        description: "Handles finances"
      },
      member: {
        label: "Member",
        icon: Users,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        description: "Cabinet member"
      }
    };
    return configs[designation] || configs.member;
  };

  const designationConfig = getDesignationConfig(member.designation);
  const Icon = designationConfig.icon;

  // Calculate academic info
  const academicInfo = {
    class: member.class?.className || "Not specified",
    section: member.section?.sectionName ? `Section ${member.section.sectionName}` : "",
    rollNumber: member.rollNumber,
    session: member.session
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/cabinet">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Student Cabinet
        </Link>
      </Button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 overflow-hidden">
            {/* Profile Header */}
            <div className={`relative h-32 ${designationConfig.color.replace('bg-', 'bg-gradient-to-r from-').replace('100', '500').replace('800', '600')}`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative h-full flex items-center justify-center text-white">
                <Icon className="w-12 h-12" />
              </div>
            </div>
            
            <CardContent className="relative pt-0">
              {/* Avatar */}
              <div className="flex justify-center -mt-12 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={member.student?.photo} 
                    alt={member.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-800">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Designation */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                <Badge className={`mt-2 text-lg px-4 py-1 ${designationConfig.color}`}>
                  <Icon className="w-4 h-4 mr-2" />
                  {designationConfig.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {designationConfig.description}
                </p>
              </div>

              {/* Academic Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <School className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Class</div>
                    <div className="font-semibold">{academicInfo.class}</div>
                  </div>
                </div>
                
                {academicInfo.section && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Section</div>
                      <div className="font-semibold">{academicInfo.section}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <BadgeCheck className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Roll Number</div>
                    <div className="font-semibold">{academicInfo.rollNumber}</div>
                  </div>
                </div>
              </div>

              {/* Status and Session */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={member.isActive ? "default" : "secondary"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session</span>
                  <span className="font-semibold">{academicInfo.session}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/cabinet">
                    <Users className="w-4 h-4 mr-2" />
                    View All Cabinet Members
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/clubs">
                    <Trophy className="w-4 h-4 mr-2" />
                    Explore Student Clubs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs for different sections */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="cabinet">Cabinet Role</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                        <p className="text-gray-900 font-medium text-lg">{member.name}</p>
                      </div>
                      
                      {member.student?.fatherName && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Father's Name</h3>
                          <p className="text-gray-900 font-medium">{member.student.fatherName}</p>
                        </div>
                      )}
                      
                      {member.student?.motherName && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Mother's Name</h3>
                          <p className="text-gray-900 font-medium">{member.student.motherName}</p>
                        </div>
                      )}
                      
                      {member.student?.dateOfBirth && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                          <p className="text-gray-900 font-medium flex items-center gap-2">
                            <Cake className="w-4 h-4" />
                            {formatDate(member.student.dateOfBirth)}
                            {member.student.age && (
                              <span className="text-sm text-gray-500">
                                ({member.student.age} years old)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {member.student?.bloodGroup && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Blood Group</h3>
                          <p className="text-gray-900 font-medium flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            {member.student.bloodGroup}
                          </p>
                        </div>
                      )}
                      
                      {member.student?.address && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                          <p className="text-gray-900 font-medium flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                            <span className="text-sm">{member.student.address}</span>
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                        <p className="text-gray-900 font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDate(member.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Badges */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Student Achievements
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">
                        <Icon className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <div className="text-sm font-medium">Cabinet Position</div>
                      <div className="text-xs text-gray-600">{designationConfig.label}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        <GraduationCap className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <div className="text-sm font-medium">Academic Level</div>
                      <div className="text-xs text-gray-600">{academicInfo.class}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        <Trophy className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <div className="text-sm font-medium">Leadership Role</div>
                      <div className="text-xs text-gray-600">Student Cabinet</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">
                        <Calendar className="w-8 h-8 mx-auto mb-2" />
                      </div>
                      <div className="text-sm font-medium">Session</div>
                      <div className="text-xs text-gray-600">{academicInfo.session}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Information Tab */}
            <TabsContent value="academic" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Academic Information
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Current Class */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <School className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold">Current Class</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{academicInfo.class}</p>
                        <p className="text-sm text-gray-600">Academic year {academicInfo.session}</p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold">Section & Roll</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-green-700">
                            {academicInfo.section || "N/A"}
                          </p>
                          <p className="text-lg text-gray-600">• Roll: {academicInfo.rollNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic Performance */}
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-3">Student Cabinet Role</h3>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${designationConfig.color}`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{designationConfig.label}</h4>
                          <p className="text-gray-600">{designationConfig.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Session Timeline */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Academic Session</h3>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Session</span>
                        <span className="font-semibold">{academicInfo.session}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Status</span>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Currently Active" : "Session Completed"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cabinet Role Tab */}
            <TabsContent value="cabinet" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    Student Cabinet Role
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Role Details */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${designationConfig.color}`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{designationConfig.label}</h3>
                          <p className="text-gray-600">{member.name}</p>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        {designationConfig.description}. As a member of the student cabinet, 
                        {member.name} plays a vital role in representing student interests, 
                        organizing school events, and contributing to the school community.
                      </p>
                    </div>

                    {/* Responsibilities */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key Responsibilities</h3>
                      <ul className="space-y-2">
                        {designationConfig.label === 'President' && (
                          <>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                              <span>Lead cabinet meetings and decision-making processes</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                              <span>Represent student body in school administration meetings</span>
                            </li>
                          </>
                        )}
                        {designationConfig.label === 'Vice President' && (
                          <>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                              <span>Assist the president in all duties</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                              <span>Act as president in their absence</span>
                            </li>
                          </>
                        )}
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span>Participate in organizing school events and activities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span>Serve as a liaison between students and administration</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span>Promote school spirit and student engagement</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6 mt-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    Contact Information
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Contact Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Home className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="text-sm text-gray-500">Class Information</div>
                            <div className="font-semibold">
                              {academicInfo.class} {academicInfo.section && `• ${academicInfo.section}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <BadgeCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="text-sm text-gray-500">Roll Number</div>
                            <div className="font-semibold">{academicInfo.rollNumber}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="text-sm text-gray-500">Cabinet Session</div>
                            <div className="font-semibold">{academicInfo.session}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="text-sm text-gray-500">Status</div>
                            <div className="font-semibold">
                              {member.isActive ? "Active Member" : "Alumni Member"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Parent/Guardian Information */}
                    {(member.student?.fatherName || member.student?.motherName) && (
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-3">Parent/Guardian Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {member.student?.fatherName && (
                            <div>
                              <div className="text-sm text-gray-500">Father's Name</div>
                              <div className="font-medium">{member.student.fatherName}</div>
                            </div>
                          )}
                          {member.student?.motherName && (
                            <div>
                              <div className="text-sm text-gray-500">Mother's Name</div>
                              <div className="font-medium">{member.student.motherName}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Related Links */}
                    <div>
                      <h3 className="font-semibold mb-3">Related Links</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button asChild variant="outline" className="justify-start">
                          <Link to="/cabinet">
                            <Users className="w-4 h-4 mr-2" />
                            Full Cabinet List
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-start">
                          <Link to="/clubs">
                            <Trophy className="w-4 h-4 mr-2" />
                            Student Clubs
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-start">
                          <Link to="/events">
                            <Calendar className="w-4 h-4 mr-2" />
                            School Events
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="justify-start">
                          <Link to="/">
                            <Building className="w-4 h-4 mr-2" />
                            School Homepage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Skeleton Loading Component
function StudentCabinetDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-32 mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Skeleton */}
        <div>
          <Card className="overflow-hidden">
            <div className="h-32 bg-gray-200" />
            <CardContent className="relative pt-0">
              <div className="flex justify-center -mt-12 mb-4">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-8 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto mb-6" />
              
              {[1, 2, 3].map(i => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ))}
              
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column Skeleton */}
        <div className="lg:col-span-2">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}