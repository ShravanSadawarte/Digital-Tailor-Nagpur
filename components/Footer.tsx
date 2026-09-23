import Link from "next/link";
import { Icon, Ornament } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="footer-rich">
      <div className="container">
        <Ornament />
        <div className="foot-grid" style={{ marginTop: 28 }}>
          <div className="foot-brand">
            <Link href="/" className="logo">
              <span className="logo-icon"><Icon name="scissors" size={22} /></span>
              <span className="logo-text" style={{ color: "#FFF9F3" }}>
                Digital Tailor <small>Nagpur</small>
              </span>
            </Link>
            <p>
              Custom stitching, express alterations and doorstep pickup —
              trusted by Nagpur families for 25+ years.
            </p>
          </div>

          <div className="foot-col">
            <h4>Shop</h4>
            <ul>
              <li><Link href="/shop">Collection</Link></li>
              <li><Link href="/builder">Dress Builder</Link></li>
              <li><Link href="/transformations">Raw → Best</Link></li>
              <li><Link href="/cart">Your Bag</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4>Account</h4>
            <ul>
              <li><Link href="/profile">My Profile</Link></li>
              <li><Link href="/profile">Measurements</Link></li>
              <li><Link href="/profile">Track Orders</Link></li>
              <li><Link href="/#booking">Book a Pickup</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4>Visit Us</h4>
            <ul>
              <li><Icon name="pin" size={16} /><a href="https://www.google.com/maps/search/?api=1&query=26B%2C%20Hanuman%20Society%2C%20Vaishali%20Nagar%2C%20Nagpur%2C%20Maharashtra%20440017" target="_blank" rel="noopener noreferrer">26B, Hanuman Society, Vaishali Nagar, Nagpur 440017</a></li>
              <li><Icon name="phone" size={16} /><a href="tel:+919876543210">+91 98765 43210</a></li>
              <li><Icon name="mail" size={16} /><a href="mailto:hello@digitaltailor.in">hello@digitaltailor.in</a></li>
              <li><Icon name="clock" size={16} />Mon–Sat, 10am – 8pm</li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© 2026 Digital Tailor Nagpur. All rights reserved.</span>
          <span>Stitched with care in Nagpur</span>
        </div>
      </div>
    </footer>
  );
}
