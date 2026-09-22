"use client";

import { Icon } from "@/components/icons";

export const STAGES = ["pending", "confirmed", "stitching", "ready", "delivered"];
const STAGE_LABEL: Record<string, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  stitching: "Stitching",
  ready: "Ready",
  delivered: "Delivered",
};

export function shortId(id: string) {
  return (id || "").slice(0, 8).toUpperCase();
}

export function payLabel(s: string) {
  const m: Record<string, string> = {
    pending: "Payment pending",
    awaiting_verification: "Payment verifying…",
    verified: "Payment verified ✓",
    rejected: "Payment rejected — call the shop",
    paid_on_pickup: "Pay on pickup",
    done: "Paid ✓",
  };
  return m[s] || s;
}

export function OrderSteps({ status }: { status: string }) {
  if (status === "cancelled") return <p className="form-err">Order cancelled</p>;
  const idx = Math.max(0, STAGES.indexOf(status));
  return (
    <div className="steps">
      {STAGES.map((s, i) => (
        <div
          key={s}
          className={`step${i < idx ? " done" : ""}${i === idx ? " current" : ""}`}
        >
          <span className="step-dot" />
          <span>{STAGE_LABEL[s]}</span>
        </div>
      ))}
    </div>
  );
}

export type ReceiptLine = { label: string; amount?: number };
export const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function Receipt(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  orderNo: string;
  date: string;
  lines: ReceiptLine[];
  total: number;
  pay: string;
}) {
  const { open, onClose, title, orderNo, date, lines, total, pay } = props;
  if (!open) return null;
  return (
    <div
      className="modal open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box receipt">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="receipt-head">
          <span className="logo-icon"><Icon name="scissors" size={22} /></span>
          <div>
            <h2>{title}</h2>
            <small>Digital Tailor, Nagpur</small>
          </div>
        </div>
        <div className="receipt-meta">
          <span>
            Order <strong>#{shortId(orderNo)}</strong>
          </span>
          <span>{date}</span>
        </div>
        <div className="receipt-lines">
          {lines.map((l, i) => (
            <div key={i} className="receipt-line">
              <span>{l.label}</span>
              {l.amount !== undefined && <strong>{inr(l.amount)}</strong>}
            </div>
          ))}
        </div>
        <div className="receipt-total">
          <span>Total</span>
          <strong>{inr(total)}</strong>
        </div>
        <p className="pay-chip">{payLabel(pay)}</p>
        <small className="receipt-note">
          Show this receipt at the shop or on delivery. Thank you!
        </small>
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
