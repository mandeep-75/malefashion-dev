import { useState } from "react";
import { Phone, MapPin } from "lucide-react";

const OFFICES = [
  { name: "Mumbai", lines: ["195 Bandra West, Mumbai 400 050", "+91 98200 31409"] },
  { name: "Bengaluru", lines: ["109 MG Road, Bengaluru 560 001", "+91 98450 42398"] },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

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
                          {line}
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
                <li className="flex gap-4">
                  <Phone size={20} className="mt-1 shrink-0 text-primary" />
                  <div>
                    <h4 className="text-ink">Phone</h4>
                    <p className="text-sm">+91 98200 31409</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              {sent ? (
                <div className="border border-hairline p-8 text-center">
                  <h3 className="font-display text-xl text-ink">Message sent</h3>
                  <p className="mt-2">Thanks {form.name.split(" ")[0]} — we&apos;ll be in touch shortly.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setForm({ name: "", email: "", message: "" });
                    }}
                    className="primary-btn mt-6"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSent(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="contact-name" className="sr-only">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      required
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Name"
                      className="w-full border border-hairline-2 px-4 py-3.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="sr-only">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={set("email")}
                      placeholder="Email"
                      className="w-full border border-hairline-2 px-4 py-3.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="sr-only">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={set("message")}
                      placeholder="Message"
                      className="w-full resize-y border border-hairline-2 px-4 py-3.5 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="site-btn w-full sm:w-auto">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
