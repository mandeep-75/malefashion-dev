import { MapPin, Phone } from "lucide-react";

const OFFICES = [
  { name: "Punjab", lines: ["Hoshiarpur / Hariana"] },
];

const isEmail = (line) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim());
const isPhone = (line) => /^[+\d][\d\s()+-]{6,}$/.test(line.trim());

/**
 * Each office line is linked automatically when it looks like a phone number or
 * an email, so a studio can list whatever it has without the markup changing.
 * Addresses fall through as plain text.
 */
function OfficeLine({ line }) {
  if (isEmail(line)) {
    return (
      <a href={`mailto:${line.trim()}`} className="transition-colors hover:text-primary">
        {line}
      </a>
    );
  }

  if (isPhone(line)) {
    return (
      <a
        href={`tel:${line.replace(/[^\d+]/g, "")}`}
        className="transition-colors hover:text-primary"
      >
        {line}
      </a>
    );
  }

  return line;
}

/** Pre-filled mailto. Change the address to wherever enquiries should land. */
const MAILTO =
  "mailto:malefashion.in@gmail.com?subject=" +
  encodeURIComponent("Enquiry from the website") +
  "&body=" +
  encodeURIComponent("Hi,\n\n");

export default function Contact() {
  return (
    <>
      <section className="spad">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="section-title text-left">
                <span>Information</span>
                <h2>Contact Us</h2>
                <p>
                  We&apos;re a small team and we read every message. Expect a reply within one
                  business day.
                </p>
              </div>

              <ul className="mt-8 space-y-6">
                {OFFICES.map((office) => (
                  <li key={office.name} className="flex gap-4">
                    <MapPin size={20} className="mt-1 shrink-0 text-primary" />
                    <div>
                      <h4 className="text-ink">{office.name}</h4>
                      {office.lines.map((line) => (
                        <p key={line} className="text-sm">
                          <OfficeLine line={line} />
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
                <li className="flex gap-4">
                  <Phone size={20} className="mt-1 shrink-0 text-primary" />
                  <div>
                    <h4 className="text-ink">Phone</h4>
                    <p className="text-sm">+91 98200 00000</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* No server to post to, so there is no form to submit — a `mailto:`
                handoff hands the whole conversation to the visitor's own mail
                client, which is where the reply gets sent from anyway. */}
                <div>
                  <h3 className="font-display text-xl text-ink">Send us a message</h3>
                  <p className="mt-2 text-sm">
                    Opens your mail app with the address already filled in. Write
                    what you need there and send — we read everything.
                  </p>

                  <a
                    href={MAILTO}
                    className="site-btn mt-6 inline-block"
                  >
                    Send Message
                  </a>
                </div>
          </div>
        </div>
      </section>
    </>
  );
}
