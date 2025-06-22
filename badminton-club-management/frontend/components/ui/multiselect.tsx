// components/ui/multi-select.tsx
'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Select options...', label }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div>
      {label && <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            'w-full inline-flex items-center justify-between border rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none',
            'bg-white hover:bg-gray-50',
            selected.length === 0 && 'text-muted-foreground'
          )}
        >
          <span>
            {selected.length > 0
              ? options
                  .filter((opt) => selected.includes(opt.value))
                  .map((opt) => opt.label)
                  .join(', ')
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandList>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleOption(option.value)}
                    className="cursor-pointer"
                  >
                    <span
                      className={cn(
                        'mr-2 h-4 w-4 rounded-sm border border-gray-300 inline-block text-center text-xs',
                        selected.includes(option.value) ? 'bg-blue-500 text-white' : 'bg-white'
                      )}
                    >
                      {selected.includes(option.value) ? <Check className="w-4 h-4" /> : null}
                    </span>
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
