// components/common/ParentSearchSelector.jsx
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, User } from "lucide-react";
import { useLazyGetParentsInSearchQuery } from "@/features/apis/parentsApi";

export default function ParentSearchSelector({ 
  selectedParent, 
  onParentSelect, 
  onParentClear,
  className = "" 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  const [searchParents, { isLoading }] = useLazyGetParentsInSearchQuery();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchParents({ 
          search: searchQuery, 
          limit: 10 
        }).unwrap();
        
        setSearchResults(result.docs || result.parents || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, searchParents]);

  const handleParentSelect = (parent) => {
    onParentSelect(parent);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClear = () => {
    onParentClear();
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium">Parent (Optional)</label>
      
      {/* Selected Parent Display */}
      {selectedParent && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">{selectedParent.name}</p>
              <p className="text-sm text-gray-600">
                {selectedParent.email} • {selectedParent.phone}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Search Input */}
      {!selectedParent && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search parents by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          {searchResults.map((parent) => (
            <div
              key={parent._id}
              className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleParentSelect(parent)}
            >
              <User className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">{parent.name}</p>
                <p className="text-sm text-gray-600">
                  {parent.email} • {parent.phone}
                </p>
                {parent.children && (
                  <p className="text-xs text-gray-500">
                    {parent.children.length} children
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="text-center py-4 text-gray-500">
          Searching parents...
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isLoading && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No parents found matching "{searchQuery}"
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Start typing to search for parents. Leave empty if no parent assignment needed.
      </p>
    </div>
  );
}