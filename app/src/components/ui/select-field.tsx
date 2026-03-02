"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface SelectOption {
  id: number;
  name: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  options: readonly SelectOption[];
  disabled?: boolean;
  includeEmptyOption?: boolean;
  emptyOptionLabel?: string;
  defaultValue?: number | string | null;
}

export function SelectField({
  name,
  label,
  options,
  disabled,
  includeEmptyOption,
  emptyOptionLabel = "None / Not Applicable",
  defaultValue,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedValue, setSelectedValue] = useState<string>(() => {
    if (defaultValue != null && String(defaultValue).trim() !== "") {
      return String(defaultValue);
    }
    if (!includeEmptyOption && options.length > 0) {
      return String(options[0].id);
    }
    return "";
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.id.toString() === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId: number) => {
    setSelectedValue(optionId.toString());
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelectedValue("");
    setSearch("");
    setIsOpen(false);
  };

  const displayText = selectedOption
    ? selectedOption.name
    : includeEmptyOption
    ? emptyOptionLabel
    : "- Select " + label + " -";

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-[#4a5266]">
        {label}
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || options.length === 0}
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm transition-all duration-200 
          ${isOpen 
            ? "border-[#3B9F41] ring-1 ring-[#3B9F41]" 
            : "border-[#dfe1ed] hover:border-[#b8bcc9]"
          } 
          ${disabled ? "cursor-not-allowed bg-[#f8f9fc] text-[#8b92a7]" : "text-[#2f3339]"}
          ${selectedValue || includeEmptyOption ? "text-[#2f3339]" : "text-[#9ca3af]"}
        `}
      >
        <span className="truncate">{displayText}</span>
        <div className="flex items-center gap-1">
          {includeEmptyOption && !disabled && selectedValue && (
            <X
              className="h-3.5 w-3.5 text-[#9ca3af] hover:text-[#6b7280]"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
          <ChevronDown
            className={`h-4 w-4 text-[#6b7280] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <input type="hidden" name={name} value={selectedValue} />

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
            <div className="border-b border-[#e5e7eb] p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-[#3B9F41] focus:bg-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {includeEmptyOption && (
                <button
                  type="button"
                  onClick={() => handleSelect(0)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#6b7280] hover:bg-[#f3f5fa]"
                >
                  <span>{emptyOptionLabel}</span>
                </button>
              )}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-[#9ca3af]">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[#f3f5fa] ${
                      selectedValue === option.id.toString()
                        ? "bg-[#f0fdf4] text-[#3B9F41]"
                        : "text-[#2f3339]"
                    }`}
                  >
                    <span className="truncate">{option.name}</span>
                    {selectedValue === option.id.toString() && (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
