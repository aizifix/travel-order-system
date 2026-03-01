type DashboardMetricTone = "warning" | "success" | "danger";

type DashboardMetricCardProps = Readonly<{
  label: string;
  value: number;
  tone: DashboardMetricTone;
}>;

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function DashboardMetricCard({
  label,
  value,
  tone,
}: DashboardMetricCardProps) {
  const toneClasses = getToneClasses(tone);

  return (
    <div className="rounded-2xl border border-[#dfe1ed] bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[#9ca7bd] sm:text-sm">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-[#2f3339]">
            {NUMBER_FORMATTER.format(value)}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${toneClasses.tile}`}
          aria-hidden="true"
        >
          <MetricStatusIcon tone={tone} className={toneClasses.icon} />
        </div>
      </div>
    </div>
  );
}

function getToneClasses(tone: DashboardMetricTone) {
  switch (tone) {
    case "success":
      return { tile: "bg-[#B3FBD2]", icon: "text-[#18A453]" };
    case "danger":
      return { tile: "bg-[#FFB1B1]", icon: "text-[#FF2B2B]" };
    case "warning":
    default:
      return { tile: "bg-[#FEF6D2]", icon: "text-[#F2C312]" };
  }
}

function MetricStatusIcon({
  tone,
  className,
}: Readonly<{ tone: DashboardMetricTone; className: string }>) {
  if (tone === "success") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`h-7 w-7 ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.2 2.4 2.4 4.6-5" />
      </svg>
    );
  }

  if (tone === "danger") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`h-7 w-7 ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-7 w-7 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l3 2" />
      <path d="M17.6 17.6 20 20" />
    </svg>
  );
}

export type { DashboardMetricTone };
