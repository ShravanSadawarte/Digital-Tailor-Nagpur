import Reveal from "@/components/Reveal";
import { Icon, Ornament } from "@/components/icons";

const ADDRESS = "26B, Hanuman Society, Vaishali Nagar, Nagpur, Maharashtra 440017";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("26B, Hanuman Society, Vaishali Nagar, Nagpur, Maharashtra 440017");

/** Flagship boutique address + directions. */
export default function Visit() {
  return (
    <section className="section" id="visit">
      <div className="container">
        <Reveal>
          <div className="visit-card">
            <div>
              <span className="eyebrow">Visit the boutique</span>
              <h2>Find us in Vaishali Nagar</h2>
              <p className="visit-addr">
                <Icon name="pin" size={20} />
                {ADDRESS}
              </p>
              <p className="muted" style={{ marginBottom: 0 }}>
                Walk in for fittings, fabric selection and same-day
                alterations — or book a free doorstep pickup anywhere in Nagpur.
              </p>
            </div>
            <div className="visit-side">
              <p className="visit-hours">
                <Icon name="clock" size={17} />
                Mon–Sat, 10am – 8pm
              </p>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                Get Directions →
              </a>
            </div>
          </div>
        </Reveal>
        <Ornament />
      </div>
    </section>
  );
}
