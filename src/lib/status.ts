export const STATUSES = [
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "QUOTED",
    "NEGOTIATING",
    "CONVERTED",
    "DROPPED",
  ] as const;
  
  export type Status = (typeof STATUSES)[number];
  
  export const STATUS_META: Record<
    Status,
    { label: string; text: string; bg: string }
  > = {
    NEW: { label: "New", text: "text-st-new", bg: "bg-st-new-bg" },
    CONTACTED: { label: "Contacted", text: "text-st-contacted", bg: "bg-st-contacted-bg" },
    FOLLOW_UP: { label: "Follow-up", text: "text-st-followup", bg: "bg-st-followup-bg" },
    QUOTED: { label: "Quoted", text: "text-st-quoted", bg: "bg-st-quoted-bg" },
    NEGOTIATING: { label: "Negotiating", text: "text-st-negotiating", bg: "bg-st-negotiating-bg" },
    CONVERTED: { label: "Converted", text: "text-st-converted", bg: "bg-st-converted-bg" },
    DROPPED: { label: "Dropped", text: "text-st-dropped", bg: "bg-st-dropped-bg" },
  };