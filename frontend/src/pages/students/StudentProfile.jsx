// components/student/StudentProfile.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Calendar, BookOpen, Users, Edit, Save, X, Camera } from "lucide-react";
import { useGetStudentProfileQuery, useUpdateStudentProfileMutation, useUploadStudentPhotoMutation } from "@/features/apis/studentsApi";
import { format } from "date-fns";
import Loader from "@/components/common/Loader";

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const { data: profile, isLoading } = useGetStudentProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateStudentProfileMutation();

  const student = profile?.user || {};

  const [uploadPhoto] = useUploadStudentPhotoMutation();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // Form state

  const [formData, setFormData] = useState({
    name: student.name || '',
    email: student.email || '',
    guardianContact: student.guardianContact || '', // Changed from contact
    dateOfBirth: student.dateOfBirth ? format(new Date(student.dateOfBirth), 'yyyy-MM-dd') : '',
    gender: student.gender || '',
    address: student.address || '',
    religion: student.religion || '', // New
    disabilityDescription: student.disabilityDescription || '' // New
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.contact || '',
      dateOfBirth: student.dateOfBirth ? format(new Date(student.dateOfBirth), 'yyyy-MM-dd') : '',
      gender: student.gender || '',
      address: student.address || ''
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    console.log("handle photo upload :", file)
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      await uploadPhoto({ id: student._id, formData }).unwrap();
      toast.success("Profile photo updated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and academic details</p>
        </div>

        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="text-center">
          <div className="relative inline-block">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || '')}&background=random`;
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600"
              title="Change photo"
            >
              <Camera className="w-4 h-4" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
                className="hidden"
                disabled={isUploadingPhoto}
              />
            </label>
          </div>
          {isUploadingPhoto && (
            <p className="text-sm text-gray-500 mt-2">Uploading...</p>
          )}
        </div>

        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-blue-600" />
                </div>

                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-gray-600">Student</p>

                <div className="mt-4 space-y-2">
                  <Badge variant="outline" className="w-full justify-center">
                    Roll No: {student.rollNumber}
                  </Badge>
                  {student.class && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Class: {student.class.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>

                {student.parent && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Parent:</span>
                    <span className="font-medium">{student.parent.name}</span>
                  </div>
                )}

                {student.grade && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Grade Level:</span>
                    <span className="font-medium">{student.grade.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="academic">Academic Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        disabled={!isEditing}
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>

                  {/* Religion */}
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input
                      id="religion"
                      value={formData.religion}
                      onChange={(e) => handleInputChange('religion', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Guardian Contact (replacing phone) */}
                  <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian Contact</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="guardianContact"
                        type="tel"
                        value={formData.guardianContact}
                        onChange={(e) => handleInputChange('guardianContact', e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {student.isPhysicallyDisabled && (
                    <div className="space-y-2">
                      <Label htmlFor="disabilityDescription">Disability Description</Label>
                      <textarea
                        id="disabilityDescription"
                        value={formData.disabilityDescription}
                        onChange={(e) => handleInputChange('disabilityDescription', e.target.value)}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Information Tab */}
            <TabsContent value="academic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Add session */}
                      <div className="flex justify-between">
                        <span>Session:</span>
                        <span className="font-medium">{student.session || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-semibold">Class</p>
                          <p className="text-gray-600">{student.class?.name || 'Not assigned'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <Users className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold">Roll Number</p>
                          <p className="text-gray-600">{student.rollNumber}</p>
                        </div>
                      </div>

                      {student.grade && (
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 font-bold">G</span>
                          </div>
                          <div>
                            <p className="font-semibold">Grade Level</p>
                            <p className="text-gray-600">{student.grade.name}</p>
                          </div>
                        </div>
                      )}

                      {student.parent && (
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <User className="w-8 h-8 text-orange-600" />
                          <div>
                            <p className="font-semibold">Parent</p>
                            <p className="text-gray-600">{student.parent.name}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Academic History */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">Academic History</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Enrollment Date:</span>
                          <span className="font-medium">
                            {student.createdAt ? format(new Date(student.createdAt), 'MMM dd, yyyy') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Academic Year:</span>
                          {/* <span className="font-medium">{CURRENT_YEAR}</span> */}
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Currently Enrolled
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      For security changes, please contact your school administrator.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-500">Last changed: N/A</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Change Password
                      </Button>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div >
  );
}