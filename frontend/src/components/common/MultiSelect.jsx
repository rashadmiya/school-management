// components/ui/multi-select.jsx
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppSelector } from "@/features/store";

export function MultiSelect({ options, selected, onChange, placeholder = "Select items...", isDarkMode = false }) {
    const [open, setOpen] = useState(false);

    // Theme-based classes
    const theme = {
        button: isDarkMode 
            ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white" 
            : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
        popover: isDarkMode 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200",
        command: isDarkMode 
            ? "bg-gray-800 text-white" 
            : "bg-white text-gray-900",
        commandInput: isDarkMode 
            ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" 
            : "bg-white border-gray-200 text-gray-900",
        commandEmpty: isDarkMode 
            ? "text-gray-400" 
            : "text-gray-500",
        commandGroup: isDarkMode 
            ? "text-gray-300" 
            : "text-gray-700",
        commandItem: isDarkMode 
            ? "text-gray-300 hover:bg-gray-700 hover:text-white data-[selected=true]:bg-gray-700" 
            : "text-gray-900 hover:bg-gray-100 data-[selected=true]:bg-gray-100",
        badge: isDarkMode 
            ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600" 
            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
        badgeX: isDarkMode 
            ? "text-gray-400 hover:text-white" 
            : "text-gray-500 hover:text-gray-900",
        selectedDot: isDarkMode 
            ? "bg-blue-500" 
            : "bg-blue-500",
        unselectedDot: isDarkMode 
            ? "bg-gray-600" 
            : "bg-gray-300",
        placeholder: isDarkMode 
            ? "text-gray-400" 
            : "text-gray-500",
        selectedCount: isDarkMode 
            ? "text-white" 
            : "text-gray-900",
    };

    const handleSelect = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter(item => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const handleRemove = (value) => {
        onChange(selected.filter(item => item !== value));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={`w-full justify-between ${theme.button}`}
                    >
                        {selected.length > 0 ? (
                            <span className={theme.selectedCount}>
                                {selected.length} selected
                            </span>
                        ) : (
                            <span className={theme.placeholder}>
                                {placeholder}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className={`w-full p-0 ${theme.popover}`}>
                    <Command className={theme.command}>
                        <CommandInput 
                            placeholder="Search items..." 
                            className={theme.commandInput}
                        />
                        <CommandEmpty className={theme.commandEmpty}>
                            No items found.
                        </CommandEmpty>
                        <CommandGroup className={theme.commandGroup}>
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                        className={theme.commandItem}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isSelected ? theme.selectedDot : theme.unselectedDot}`} />
                                            {option.label}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map(value => {
                        const option = options.find(opt => opt.value === value);
                        return (
                            <Badge 
                                key={value} 
                                variant="secondary" 
                                className={`gap-1 ${theme.badge}`}
                            >
                                {option?.label || value}
                                <X
                                    className={`w-3 h-3 cursor-pointer ${theme.badgeX}`}
                                    onClick={() => handleRemove(value)}
                                />
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}