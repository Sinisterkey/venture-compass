import { Link } from "react-router-dom";
import brandLogo from "@/assets/ngo-bridge-logo.png";

const footerLinks = {
  Platform: [
    { label: "Discover Organizations", path: "/discover" },
    { label: "Browse Funders", path: "/investors" },
    { label: "For NGOs", path: "/register" },
    { label: "For Funders", path: "/register" },
  ],
  Company: [
    { label: "About", path: "/about" },
    { label: "Blog", path: "#" },
    { label: "Careers", path: "#" },
    { label: "Contact", path: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "#" },
    { label: "Terms of Service", path: "#" },
    { label: "Cookie Policy", path: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={brandLogo} alt="NGO Bridge logo" width={36} height={36} loading="lazy" className="h-9 w-9 bg-white rounded-md p-1" />
              <span className="font-display text-xl font-bold">
                NGO <span className="text-primary">Bridge</span>
              </span>
            </Link>
            <p className="text-sm text-secondary-foreground/70 max-w-xs leading-relaxed">
              Using AI to connect African NGOs, community organizations, and social enterprises with the funders most aligned with their mission.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm mb-4 text-secondary-foreground/90">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} NGO Bridge. All rights reserved.
          </p>
          <p className="text-xs text-secondary-foreground/50">
            Building trusted funding partnerships across Africa 🌍
          </p>
        </div>
      </div>
    </footer>
  );
}
