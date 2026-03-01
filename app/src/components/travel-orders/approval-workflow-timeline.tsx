"use client";

import type { RequesterTravelOrderStep } from "@/src/server/travel-orders/service";

type WorkflowTimelineOrder = Readonly<{
  orderDateLabel: string;
  status: string;
  step1: RequesterTravelOrderStep;
  step2: RequesterTravelOrderStep;
  approvedByName?: string | null;
}>;

type ApprovalWorkflowTimelineProps = Readonly<{
  order: WorkflowTimelineOrder;
}>;

type TimelineStepTone = "done" | "pending" | "danger";

type TimelineStep = Readonly<{
  id: 1 | 2 | 3 | 4;
  title: string;
  detail: string;
  tone: TimelineStepTone;
}>;

function getStepToneClasses(tone: TimelineStepTone): string {
  if (tone === "done") {
    return "border-[#3B9F41] bg-[#3B9F41] text-white";
  }
  if (tone === "danger") {
    return "border-[#E35E5E] bg-[#E35E5E] text-white";
  }
  return "border-[#dfe1ed] bg-[#f8f9fc] text-[#5d6780]";
}

function getConnectorClasses(tone: TimelineStepTone): string {
  if (tone === "done") {
    return "bg-[#3B9F41]";
  }
  if (tone === "danger") {
    return "bg-[#E35E5E]";
  }
  return "bg-[#d7dbe8]";
}

function getDetailText(name: string | null, date: string | null): string {
  const safeName = name?.trim() ? name : "Pending";
  const safeDate = date?.trim() ? date : "Pending";
  return `${safeName} - ${safeDate}`;
}

function buildWorkflowSteps(order: WorkflowTimelineOrder): readonly TimelineStep[] {
  const normalizedStatus = order.status.toUpperCase();

  const step1Approved = order.step1.action === "APPROVED";
  const step2Approved = order.step2.action === "APPROVED";
  const done = normalizedStatus === "APPROVED";
  const isTerminalFailure =
    normalizedStatus === "REJECTED" || normalizedStatus === "CANCELLED";

  const step1Detail = step1Approved
    ? getDetailText(order.step1.actedByName, order.step1.actionAtLabel)
    : "Pending";

  const step2ApproverName = order.step2.actedByName ?? order.approvedByName ?? null;
  const step2Detail = step2Approved
    ? getDetailText(step2ApproverName, order.step2.actionAtLabel)
    : "Pending";

  let doneDetail = "Pending";
  if (done) {
    doneDetail = order.step2.actionAtLabel?.trim() || "Date unavailable";
  } else if (normalizedStatus === "REJECTED") {
    doneDetail = "Rejected";
  } else if (normalizedStatus === "CANCELLED") {
    doneDetail = "Cancelled";
  } else if (normalizedStatus === "RETURNED") {
    doneDetail = "Returned for changes";
  }

  return [
    {
      id: 1,
      title: "Create TO",
      detail: order.orderDateLabel || "-",
      tone: "done",
    },
    {
      id: 2,
      title: "1st Approved",
      detail: step1Detail,
      tone: step1Approved
        ? "done"
        : isTerminalFailure
          ? "danger"
          : "pending",
    },
    {
      id: 3,
      title: "Final Approval",
      detail: step2Detail,
      tone: step2Approved
        ? "done"
        : isTerminalFailure
          ? "danger"
          : "pending",
    },
    {
      id: 4,
      title: "Done",
      detail: doneDetail,
      tone: done ? "done" : isTerminalFailure ? "danger" : "pending",
    },
  ] as const;
}

export function ApprovalWorkflowTimeline({ order }: ApprovalWorkflowTimelineProps) {
  const steps = buildWorkflowSteps(order);

  return (
    <div>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="flex flex-1 items-start">
              <div className="w-[85px] text-center">
                <span
                  className={`mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${getStepToneClasses(step.tone)}`}
                >
                  {step.id}
                </span>
                <p className="mt-2 text-sm font-semibold text-[#2f3339]">{step.title}</p>
                <p className="mt-0.5 text-xs text-[#6e7790]">{step.detail}</p>
              </div>
              {!isLast ? (
                <span
                  className={`mx-1 mt-4 h-1 flex-1 ${getConnectorClasses(step.tone)}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
