import { requireRole } from "@/src/server/auth/guards";
import { getUserWithDivision } from "@/src/server/auth/service";
import { NotificationBellButton } from "@/src/components/admin/notification-bell-button";
import { ApproverShell } from "@/src/components/approver/approver-shell";
import { ApproverTravelOrdersView } from "@/src/components/approver/travel-orders/approver-travel-orders-view";
import {
  getApproverPendingNotifications,
  getTravelOrdersForApprover,
} from "@/src/server/travel-orders/service";
import { reviewTravelOrderStep1Action } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

type ApproverTravelOrdersPageProps = Readonly<{
  searchParams: SearchParams;
}>;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function toPositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function getFeedback(searchParams: {
  [key: string]: string | string[] | undefined;
}):
  | Readonly<{
      type: "success" | "error";
      text: string;
    }>
  | undefined {
  const error = firstQueryValue(searchParams.error);
  if (error) {
    return { type: "error", text: error };
  }

  const reviewedOrderNo = firstQueryValue(searchParams.reviewed);
  if (reviewedOrderNo) {
    const result = firstQueryValue(searchParams.result);
    if (result === "rejected") {
      return {
        type: "success",
        text: `Travel order ${reviewedOrderNo} was rejected at step 1.`,
      };
    }

    return {
      type: "success",
      text: `Travel order ${reviewedOrderNo} was confirmed and forwarded to RED/Admin.`,
    };
  }

  return undefined;
}

export default async function ApproverTravelOrdersPage({
  searchParams,
}: ApproverTravelOrdersPageProps) {
  const session = await requireRole("approver");
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedback(resolvedSearchParams);
  const initialOrderId = toPositiveInteger(
    firstQueryValue(resolvedSearchParams.travelOrderId),
  );

  const [userData, rows, notifications] = await Promise.all([
    getUserWithDivision(session.userId),
    getTravelOrdersForApprover(session.userId, 40),
    getApproverPendingNotifications(session.userId, 8),
  ]);

  return (
    <ApproverShell
      title="Travel Orders"
      activeItem="travel-orders"
      headerAction={
        <NotificationBellButton
          count={notifications.length}
          items={notifications.map((item) => ({
            id: `pending-${item.id}`,
            title: `${item.orderNo} needs your step-1 review`,
            description: `${item.requestedBy} - ${item.destination}`,
            timestampLabel: `Posted ${item.orderDateLabel}`,
            href: `/approver/travel-orders?travelOrderId=${item.id}`,
          }))}
          emptyMessage="No pending step-1 requests."
        />
      }
      user={
        userData
          ? {
              name: `${userData.firstName} ${userData.lastName}`.trim(),
              role: userData.role.charAt(0).toUpperCase() + userData.role.slice(1),
              division: userData.division ?? "No Division Assigned",
            }
          : undefined
      }
    >
      <ApproverTravelOrdersView
        rows={rows}
        onReview={reviewTravelOrderStep1Action}
        initialOrderId={initialOrderId}
        feedback={feedback}
      />
    </ApproverShell>
  );
}
