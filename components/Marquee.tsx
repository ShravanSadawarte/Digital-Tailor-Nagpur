import { Fragment } from "react";

const ITEMS = [
  "Custom Stitching",
  "Doorstep Pickup",
  "48-Hour Delivery",
  "24-Hour Alterations",
  "Perfect Fitting",
  "Honest Pricing",
];

/** Slow classic ticker ribbon. */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <Fragment key={half}>
            {row.map((t, i) => (
              <span key={`${half}-${i}`} className="marquee-item">
                {t} <i>◆</i>
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
