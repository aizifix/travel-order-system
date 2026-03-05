"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

type PasswordInputFieldProps = Readonly<{
  name: string;
  placeholder: string;
  autoComplete?: string;
}>;

export function PasswordInputField({
  name,
  placeholder,
  autoComplete,
}: PasswordInputFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4E5971]/70">
        <Lock aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </span>

      <input
        name={name}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-[46px] w-full rounded-[9px] border border-[#D7E1E2] bg-[#FAFCFC] pl-12 pr-12 text-[15px] text-[#2E363A] outline-none placeholder:text-[#4E5971]/70 focus:border-[#1CB061]/70 focus:ring-2 focus:ring-[#1CB061]/15"
      />

      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 cursor-pointer -translate-y-1/2 items-center justify-center rounded-md text-[#4E5971]/60 transition hover:text-[#2E363A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1CB061]/25"
      >
        {isVisible ? (
          <EyeOff aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
        ) : (
          <Eye aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
        )}
      </button>
    </label>
  );
}
