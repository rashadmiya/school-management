// components/home/CommitteeWithQuotes.jsx
import { useState, useEffect } from "react";
import { useGetCommitteeWithQuotesQuery } from "@/features/apis/directoryApi";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Quote, Users, ChevronRight, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function CommitteeWithQuotes() {
    const { data, isLoading, error } = useGetCommitteeWithQuotesQuery();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (data?.success) {
            setMembers(data.members);
        }
    }, [data]);

    // Get initials from name
    const getInitials = (name) => {
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Get designation display name
    const getDesignationDisplay = (designation) => {
        const displayMap = {
            'chairman': 'Chairman',
            'secretary': 'Secretary',
            'principal': 'Principal'
        };
        return displayMap[designation] || designation;
    };

    if (isLoading) {
        return (
            <div className="w-full space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error || !members?.length) {
        return null; // Don't show anything if no data
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Leadership Insights
                    </h3>
                </div>
                <Link to="/committee">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        View All
                        <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            {/* Members List */}
            <div className="space-y-4">
                {members.map((member) => (
                    <Card
                        key={member._id}
                        className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {member.photo ? (
                                        <Avatar className="h-12 w-12 border-2 border-blue-100">
                                            <AvatarImage
                                                src={member.photo}
                                                alt={member.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-blue-100 text-blue-800">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                                            <User className="w-6 h-6 text-blue-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="mb-2">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                                            {member.name}
                                        </h4>
                                        <p className="text-xs text-blue-600 font-medium">
                                            {getDesignationDisplay(member.designation)}
                                        </p>
                                    </div>

                                    {/* Quote */}
                                    {member.quote && (
                                        <div className="relative">
                                            <Quote className="absolute -left-2 -top-1 w-4 h-4 text-gray-300" />
                                            <p className="text-sm text-gray-700 italic pl-3 line-clamp-3">
                                                "{member.quote}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View All Button (Mobile/Alternative) */}
            <div className="pt-2">
                <Link to="/committee" className="block">
                    <Button
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                        <Users className="mr-2 w-4 h-4" />
                        View All Committee Members
                        <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}