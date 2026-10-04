import '@/app/marketing.css';
import Link from 'next/link';
import { ThemeToggle } from '@/components/marketing/ThemeToggle';
import { TestimonialCarousel } from '@/components/marketing/TestimonialCarousel';
import type { TestimonialCard } from '@/components/marketing/TestimonialCarousel';

const LOGOS = ['scole', 'AT&T', 'zeplit', 'Fidelity', 'Windsurf', 'glean', 'Laravel'];

const TESTIMONIALS: TestimonialCard[] = [
  {
    className: 'q1',
    brand: 'Acme Legal',
    quote: '"Our NDA reviews went from two weeks to same day. The confidence scores give us real clarity."',
    cite: 'Marcus Bell, Head of Procurement',
  },
  {
    className: 'q2',
    brand: 'Windsurf',
    quote: '"We went from a two-week contract turnaround to same day. The AI catches things our outside counsel used to miss."',
    cite: 'Sarah Reyes, General Counsel',
  },
  {
    className: 'q3',
    brand: 'Fidelity',
    quote: '"What used to take our team hours per contract now takes fifteen minutes. Page citations make it trustworthy."',
    cite: 'Sarah Mitchell, Senior Counsel',
  },
];

export default function LandingPage() {
  return (
    <div className="lp">
      {/* Topbar */}
      <div className="topbar">
        Trusted by legal teams to review NDA &amp; MSA contracts with AI precision.
      </div>

      <div className="sheet">
        <div className="wrap">
          {/* Nav */}
          <nav aria-label="Primary">
            <a className="logo" href="#top">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.2 6.3L21 7l-4.7 5L21 17l-6.8-1.3L12 22l-2.2-6.3L3 17l4.7-5L3 7l6.8 1.3z" />
              </svg>
              ContractIQ
            </a>
            <div className="links">
              <a href="#platform">Platform</a>
              <a href="#stats">Pricing</a>
              <a href="#stories">Resources</a>
              <a href="#platform">Solution</a>
              <a href="#platform">Automation</a>
            </div>
            <div className="nav-r">
              <ThemeToggle />
              <Link className="btn dark sm" href="/sign-in">Sign in</Link>
            </div>
          </nav>
        </div>

        {/* Hero */}
        <header className="wrap hero" id="top">
          <div>
            <span className="pill">AI-Powered · Released this week!</span>
            <h1>Review Every NDA &amp; MSA With AI.</h1>
            <p className="lead">
              Upload a contract and get every key term with its source sentence and confidence score.
              Ask questions in plain English — answers come only from your document.
            </p>
            <div className="cta">
              <Link className="btn dark" href="/sign-up">Get Started Free</Link>
              <a className="btn ghost" href="#platform">See how it works</a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="tip a">
              <b>Key Terms Dashboard</b>
              Every clause surfaced with source sentence and confidence score.
            </div>
            <svg className="shape" viewBox="0 0 300 300">
              <defs>
                <linearGradient id="c1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset=".35" stopColor="#8d9098" />
                  <stop offset=".6" stopColor="#1b1c20" />
                  <stop offset="1" stopColor="#d5d7dc" />
                </linearGradient>
                <linearGradient id="c2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2a2b30" />
                  <stop offset=".4" stopColor="#f3f4f6" />
                  <stop offset=".7" stopColor="#6e717a" />
                  <stop offset="1" stopColor="#111" />
                </linearGradient>
              </defs>
              <path
                d="M70 20h150a30 30 0 0 1 30 30v40a30 30 0 0 1-30 30h-60v60h-50V90h-40a30 30 0 0 1-30-30V50a30 30 0 0 1 30-30z"
                fill="url(#c1)"
              />
              <path
                d="M230 280H80a30 30 0 0 1-30-30v-40a30 30 0 0 1 30-30h60v-60h50v90h40a30 30 0 0 1 30 30v10a30 30 0 0 1-30 30z"
                fill="url(#c2)"
                opacity=".96"
              />
              <path d="M90 36h120" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="tip b">
              <b>Enterprise-Grade Security</b>
              Your contracts are never used to train shared models.
            </div>
          </div>
        </header>

        {/* Logo strip */}
        <section className="logos wrap" aria-label="Customers">
          <small>Powering experiences from next-gen startups to enterprises</small>
          <div className="logo-row">
            {LOGOS.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="section wrap" id="platform">
          <h2 className="center">One Review. Fully Understood.</h2>
          <div className="feat">
            {/* Left column */}
            <div className="col-l">
              {/* AI Chat visual */}
              <div className="cell vis">
                <div className="fade-words">
                  Contracts · Key Terms · Liability · Confidentiality · Termination · Payment · Obligations · Renewals · Governing Law · Indemnification
                </div>
                <div className="search-ui">
                  <i />
                  Ask anything in ContractIQ
                </div>
              </div>
              <div className="cell txt">
                <h3>AI Chat</h3>
                <p>Ask questions in plain English. Answers come with exact page citations from your document.</p>
              </div>
              {/* Key Terms visual */}
              <div className="cell vis" style={{ borderTop: '1px solid var(--line)' }}>
                <div className="clause">
                  <div className="w">
                    con·tract
                    <em>noun | ˈkan-ˌtrakt</em>
                  </div>
                  <p>A written agreement between parties that creates obligations enforceable by law.</p>
                </div>
              </div>
              <div className="cell txt">
                <h3>Key Terms</h3>
                <p>Every clause surfaced automatically — parties, dates, liability caps, and payment terms.</p>
              </div>
            </div>

            {/* Right column: AI Contract Review */}
            <div>
              <div className="cell vis review" style={{ height: '100%', minHeight: 380, borderBottom: 0 }}>
                <div className="panel">
                  <h4>AI Summary</h4>
                  <div className="r"><span>12 Terms Extracted</span></div>
                  <div className="r"><span>Review Time: 48 Sec</span></div>
                  <div className="r"><span>Confidence: 97%</span></div>
                  <hr />
                  <h4>Review Summary</h4>
                  <div className="r"><span>Confidentiality</span><span>Standard</span></div>
                  <div className="r"><span>Liability</span><span className="hr">High Risk</span></div>
                  <div className="r"><span>Term Duration</span><span>Standard</span></div>
                  <div className="r"><span>Payment Terms</span><span>Deviation</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Contract Review footer row */}
          <div className="feat" style={{ marginTop: 0, borderTop: 0, gridTemplateColumns: '1fr' }}>
            <div
              className="cell txt"
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}
            >
              <div>
                <h3>AI Contract Review</h3>
                <p style={{ marginTop: 6 }}>
                  Every uploaded contract analysed in under a minute: key terms surfaced, risks scored,
                  and every answer grounded in the document.
                </p>
              </div>
              <Link className="btn dark sm" href="/sign-up">Get Started</Link>
            </div>
          </div>

          {/* Mini 3-col */}
          <div className="mini">
            <div className="cell">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h3>Term Extraction</h3>
              <p className="muted" style={{ fontSize: 12 }}>Every standard clause found and labelled automatically.</p>
            </div>
            <div className="cell">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" />
                </svg>
              </div>
              <h3>Risk Flagging</h3>
              <p className="muted" style={{ fontSize: 12 }}>High-risk provisions surfaced with confidence scores before you sign.</p>
            </div>
            <div className="cell">
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>Contract Chat</h3>
              <p className="muted" style={{ fontSize: 12 }}>Ask follow-up questions. Get grounded answers with page references.</p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats wrap" id="stats" style={{ paddingInline: 0 }}>
          <div className="lead wrap">
            <h2>AI That Reads Every Clause, Every Time.</h2>
            <p>
              Trusted by legal and business teams to cut contract review from 90 minutes to 15,
              with every answer grounded in the document.
            </p>
            <div>
              <Link className="btn dark sm" href="/sign-up">Request a Demo</Link>
            </div>
          </div>
          <div className="stat-list">
            <div className="stat">
              <div className="n" data-to="15" data-suf=" min">15 min</div>
              <div>
                <b>Average Review Time</b>
                <span>vs 90 minutes manually</span>
              </div>
            </div>
            <div className="stat">
              <div className="n" data-to="95" data-suf="%+">95%+</div>
              <div>
                <b>Extraction Accuracy</b>
                <span>On standard NDA/MSA clauses</span>
              </div>
            </div>
            <div className="stat">
              <div className="n" data-to="20" data-suf="+">20+</div>
              <div>
                <b>Key Terms per Contract</b>
                <span>Parties, dates, obligations, and more</span>
              </div>
            </div>
            <div className="stat">
              <div className="n" data-to="100" data-suf="%">100%</div>
              <div>
                <b>Source-Cited Answers</b>
                <span>Every answer links to the exact page</span>
              </div>
            </div>
          </div>
        </section>

        {/* Burst / CTA */}
        <section className="burst" id="cta">
          <div className="app">
            <div className="l">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.2 6.3L21 7l-4.7 5L21 17l-6.8-1.3L12 22l-2.2-6.3L3 17l4.7-5L3 7l6.8 1.3z" />
              </svg>
              <h3>AI Contract Review</h3>
              <p>
                Upload any NDA or MSA. Get every key term with its source sentence, confidence score,
                and page reference — in under a minute.
              </p>
              <div className="cta">
                <Link className="btn dark sm" href="/sign-up">Get Started for Free</Link>
                <a className="btn sm" style={{ background: '#f1f3f6', color: '#0c0c0e' }} href="#platform">
                  See how it works
                </a>
              </div>
            </div>
            <div className="chat">
              <div className="hd">
                <span>AI Assistant</span>
                <i>+ New Chat</i>
              </div>
              <div className="bub">
                Show me all liability clauses
                <small>10:24 AM</small>
              </div>
              <div>Sure. Here are the contracts with liability clauses I found:</div>
              <div className="tbl">
                <div className="tr h">
                  <span>Article</span>
                  <span>Vendor</span>
                  <span>Expiry Date</span>
                </div>
                <div className="tr">
                  <span>MSA – Acme</span>
                  <span>Acme Corp</span>
                  <span>Jul 2, 2026</span>
                </div>
                <div className="tr">
                  <span>SOW – Globex</span>
                  <span>Globex</span>
                  <span>Jun 12, 2026</span>
                </div>
                <div className="tr">
                  <span>NDA – Initech</span>
                  <span>Initech</span>
                  <span>Jun 10, 2026</span>
                </div>
              </div>
              <div className="compose">
                <span>Ask anything…</span>
                <button type="button">Send</button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section wrap" id="stories">
          <h2 className="center">Trusted By Modern Legal Teams!</h2>
          <TestimonialCarousel cards={TESTIMONIALS} />
          <div className="logo-row second">
            {LOGOS.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="section wrap" style={{ paddingTop: 20 }} id="faq">
          <h2 className="center" style={{ fontWeight: 400 }}>Frequently Asked Questions</h2>
          <div className="faq">
            <details open>
              <summary>What is AI Contract Review?</summary>
              <p>
                AI Contract Review analyses every clause in your NDA or MSA against known patterns,
                surfaces key terms with source sentences, scores confidence, and lets you chat with
                the document in plain English — all in under a minute.
              </p>
            </details>
            <details>
              <summary>How does the AI extract key terms?</summary>
              <p>
                The model reads the full contract text, identifies clauses by type (confidentiality,
                liability, payment, governing law, etc.), and returns each term with the exact source
                sentence and a confidence score. No guessing — every answer is grounded in the document.
              </p>
            </details>
            <details>
              <summary>Can the platform integrate with our existing tools?</summary>
              <p>
                ContractIQ connects to e-signature workflows and exposes an API for custom integrations.
                Direct connectors for CRM and document storage are on the roadmap.
              </p>
            </details>
            <details>
              <summary>Is my contract data secure?</summary>
              <p>
                Data is encrypted in transit and at rest. Access is role-based, and your contracts are
                never used to train shared models. Each document is isolated to your account.
              </p>
            </details>
            <details>
              <summary>Can non-legal teams use ContractIQ?</summary>
              <p>
                Yes. Sales, procurement, and finance teams use ContractIQ to understand what they are
                signing without needing legal training. The confidence scores make it clear when to
                escalate to a lawyer.
              </p>
            </details>
            <details>
              <summary>How long does a review take?</summary>
              <p>
                Most NDAs and MSAs are fully reviewed in under two minutes. The AI reads the document,
                extracts all key terms, and is ready to answer questions before you have finished
                your coffee.
              </p>
            </details>
          </div>
        </section>

        {/* Footer */}
        <footer className="wrap">
          <div className="mark" aria-hidden="true">ContractIQ</div>
          <div className="foot">
            <div>
              <a className="logo" href="#top">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.2 6.3L21 7l-4.7 5L21 17l-6.8-1.3L12 22l-2.2-6.3L3 17l4.7-5L3 7l6.8 1.3z" />
                </svg>
                ContractIQ
              </a>
              <p>
                Upload, review, and understand any NDA or MSA — one intelligent workspace that puts
                legal clarity in every team's hands.
              </p>
              <div className="soc">
                <span>X</span>
                <span>in</span>
                <span>YT</span>
              </div>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#platform">Overview</a></li>
                <li><a href="#platform">AI Review</a></li>
                <li><a href="#platform">Key Terms</a></li>
                <li><a href="#stats">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4>Developers</h4>
              <ul>
                <li><a href="#top">Docs</a></li>
                <li><a href="#top">SDKs &amp; Templates</a></li>
                <li><a href="#top">Quickstart</a></li>
                <li><a href="#top">API Endpoints</a></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#top">About</a></li>
                <li><a href="#top">Careers · 12 open</a></li>
                <li><a href="#top">Partners</a></li>
                <li><a href="#top">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="copy">© ContractIQ 2026 · All Rights Reserved</div>
        </footer>
      </div>
    </div>
  );
}
