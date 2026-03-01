"use client";

type RequesterAvatarProps = Readonly<{
  fullName: string;
  className?: string;
}>;

export function getInitials(fullName: string): string {
  const tokens = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "?";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0].charAt(0)}${tokens[tokens.length - 1].charAt(0)}`.toUpperCase();
}

export function RequesterAvatar({ fullName, className }: RequesterAvatarProps) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B9F41] to-[#2d7a31] text-sm font-bold tracking-wide text-white shadow-md ${className ?? ""}`}
      aria-hidden="true"
      title={fullName}
    >
      {getInitials(fullName)}
    </span>
  );
}
