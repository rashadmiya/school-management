// components/parent/ParentProfile.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";
import { useGetParentDashboardQuery, useUpdateParentProfileMutation } from "@/features/apis/parentsApi";

export default function ParentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: dashboardData, isLoading } = useGetParentDashboardQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateParentProfileMutation();

  const parent = dashboardData?.dashboard?.parent || {};
  const children = dashboardData?.dashboard?.children || [];

  // Form state
  const [formData, setFormData] = useState({
    phone: parent.phone || '',
    address: parent.address || ''
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
      phone: parent.phone || '',
      address: parent.address || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
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
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-blue-600" />
                </div>
                
                <h2 className="text-xl font-bold">{parent.name}</h2>
                <p className="text-gray-600">Parent</p>
                
                <div className="mt-4 space-y-2">
                  <Badge variant="outline" className="w-full justify-center">
                    {children.length} Children
                  </Badge>
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
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Children in School:</span>
                  <span className="font-medium">
                    {children.filter(child => child.class).length}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-medium">
                    {new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={parent.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={parent.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 disabled:bg-gray-50"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              {/* Children Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Children Information</h3>
                
                {children.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No children registered</p>
                    <p className="text-sm">Contact school administration to add children</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {children.map((child) => (
                      <div key={child._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{child.name}</p>
                            <p className="text-sm text-gray-500">
                              Roll: {child.rollNumber} • {child.class?.name || 'No class assigned'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {child.gender || 'N/A'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Account Security</h3>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    For password changes and security settings, please contact the school administration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}