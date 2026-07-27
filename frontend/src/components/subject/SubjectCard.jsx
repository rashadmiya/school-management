// components/subjects/SubjectCard.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export default function SubjectCard({ subject, onClick, className = "" }) {
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-lg">{subject.name}</h3>
            </div>
            
            {subject.code && (
              <Badge variant="outline" className="mb-2 font-mono">
                {subject.code}
              </Badge>
            )}
            
            {subject.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {subject.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}