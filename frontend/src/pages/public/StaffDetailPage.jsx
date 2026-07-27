// components/public/staff/StaffDetailPage.jsx
import { useParams } from "react-router-dom";
import { useGetStaffByIdQuery } from "@/features/apis/directoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Briefcase,
  User,
  Award,
  Mail,
  Cake,
  Clock,
  Building,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function StaffDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useGetStaffByIdQuery(id);
  const staff = data?.staff;

  if (isLoading) {
    return <StaffDetailSkeleton />;
  }

  if (error || !staff) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error?.data?.message || "Staff member not found or failed to load"}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/staff">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Staff Directory
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

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateServiceDuration = (joiningDate) => {
    if (!joiningDate) return null;
    const today = new Date();
    const joinDate = new Date(joiningDate);
    const years = today.getFullYear() - joinDate.getFullYear();
    const months = today.getMonth() - joinDate.getMonth();
    
    let totalMonths = years * 12 + months;
    if (today.getDate() < joinDate.getDate()) {
      totalMonths--;
    }
    
    const serviceYears = Math.floor(totalMonths / 12);
    const serviceMonths = totalMonths % 12;
    
    return `${serviceYears} year${serviceYears !== 1 ? 's' : ''} ${serviceMonths} month${serviceMonths !== 1 ? 's' : ''}`;
  };

  const age = calculateAge(staff.dateOfBirth);
  const serviceDuration = calculateServiceDuration(staff.joiningDate);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/staff">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff Directory
        </Link>
      </Button>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 overflow-hidden">
            {/* Profile Header */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="absolute inset-0 bg-black/20" />
            </div>
            
            <CardContent className="relative pt-0">
              {/* Avatar */}
              <div className="flex justify-center -mt-12 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={staff.photo} 
                    alt={staff.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-800">
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Designation */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
                <Badge className="mt-2 text-lg px-4 py-1">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {staff.designation}
                </Badge>
              </div>

              {/* Quick Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Session
                  </span>
                  <span className="font-semibold">{staff.session}</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Status
                  </span>
                  <Badge variant={staff.isActive ? "default" : "secondary"}>
                    {staff.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <Separator />
                
                {age && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Cake className="w-4 h-4 mr-2" />
                        Age
                      </span>
                      <span className="font-semibold">{age} years</span>
                    </div>
                    <Separator />
                  </>
                )}

                {serviceDuration && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        Service Duration
                      </span>
                      <span className="font-semibold">{serviceDuration}</span>
                    </div>
                    <Separator />
                  </>
                )}
              </div>

              {/* Contact Buttons */}
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <a href={`tel:${staff.phoneNumber}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call {staff.name.split(' ')[0]}
                  </a>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/staff`}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    View All Staff
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-gray-900 font-medium">{staff.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Designation</h3>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {staff.designation}
                    </p>
                  </div>
                  
                  {staff.dateOfBirth && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <Cake className="w-4 h-4" />
                        {formatDate(staff.dateOfBirth)}
                      </p>
                    </div>
                  )}
                  
                  {staff.religion && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Religion</h3>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        {staff.religion}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Session</h3>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {staff.session}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {staff.phoneNumber}
                    </p>
                  </div>
                  
                  {staff.joiningDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Joining Date</h3>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatDate(staff.joiningDate)}
                      </p>
                    </div>
                  )}
                  
                  {staff.address && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                      <p className="text-gray-900 font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {staff.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Educational Qualification Card */}
          {staff.lastQualification && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Educational Qualification
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {staff.lastQualification.name && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Degree</h3>
                      <p className="text-gray-900 font-medium">
                        {staff.lastQualification.name}
                      </p>
                    </div>
                  )}
                  
                  {staff.lastQualification.major && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Major/Subject</h3>
                      <p className="text-gray-900 font-medium">
                        {staff.lastQualification.major}
                      </p>
                    </div>
                  )}
                  
                  {staff.lastQualification.institute && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Institute</h3>
                      <p className="text-gray-900 font-medium">
                        {staff.lastQualification.institute}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Timeline Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Service Timeline
              </h2>
              
              <div className="space-y-6">
                {/* Joining Date */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Joined the Institution</h3>
                    <p className="text-gray-600">
                      {formatDate(staff.joiningDate)}
                      {serviceDuration && ` • ${serviceDuration} of service`}
                    </p>
                  </div>
                </div>
                
                {/* Current Session */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Current Session</h3>
                    <p className="text-gray-600">{staff.session}</p>
                  </div>
                </div>
                
                {/* Status */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      staff.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <ShieldCheck className={`w-5 h-5 ${
                        staff.isActive ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Current Status</h3>
                    <p className="text-gray-600">
                      {staff.isActive ? (
                        <span className="text-green-600">Active • Currently serving</span>
                      ) : (
                        <span className="text-gray-600">Inactive • Not currently serving</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation to Related Pages */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Related Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link to="/staff">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">All Staff Members</div>
                      <div className="text-sm text-gray-500">View complete staff directory</div>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link to="/committee">
                    <Users className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">School Committee</div>
                      <div className="text-sm text-gray-500">View management committee</div>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link to="/clubs">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">School Clubs</div>
                      <div className="text-sm text-gray-500">Explore extracurricular activities</div>
                    </div>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start h-auto py-3">
                  <Link to="/">
                    <Building className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Homepage</div>
                      <div className="text-sm text-gray-500">Return to school homepage</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton Loading Component
function StaffDetailSkeleton() {
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
              <Skeleton className="h-8 w-32 mx-auto mb-6" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}