// components/ui/multi-select.jsx (if you don't have it)
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function MultiSelect({ options, selected, onChange, placeholder = "Select items..." }) {
    const [open, setOpen] = useState(false);

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
                        className="w-full justify-between"
                    >
                        {selected.length > 0 ? `${selected.length} selected` : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search items..." />
                        <CommandEmpty>No items found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selected.includes(option.value) ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                        {option.label}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map(value => {
                        const option = options.find(opt => opt.value === value);
                        return (
                            <Badge key={value} variant="secondary" className="gap-1">
                                {option?.label || value}
                                <X
                                    className="w-3 h-3 cursor-pointer"
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