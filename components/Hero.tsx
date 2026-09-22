"use client";

type Props = {
  onSignup: () => void;
};

export default function Hero({ onSignup }: Props) {
  const handleBook = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-text">
          <span className="badge">Nagpur&apos;s Trusted Online Tailor</span>
          <h1>
            Perfect Fit, <span>Stitched for You</span>
          </h1>
          <p>
            Custom stitching, alteration &amp; doorstep pickup for men and
            women. Book in 30 seconds, track your order live.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-lg" onClick={onSignup}>
              Get Started
            </button>
            <a href="#contact" className="btn btn-outline btn-lg">
              Contact Us
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>5000+</strong>
              <span>Happy Customers</span>
            </div>
            <div>
              <strong>4.9★</strong>
              <span>Average Rating</span>
            </div>
            <div>
              <strong>48hr</strong>
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <div className="card">
            <h3>Book Your Stitching</h3>
            <p>Shirts • Blouses • Kurtis • Suits • Alteration</p>
            <div className="price-row">
              <span>Starting at</span>
              <strong>₹199</strong>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={handleBook}
            >
              Book Now
            </button>
            <small>Free pickup in Nagpur city</small>
          </div>
        </div>
      </div>
    </section>
  );
}
