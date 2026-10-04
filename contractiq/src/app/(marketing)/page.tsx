// Server Component — no 'use client'
import Link from 'next/link';
import { FileSearch, AlertTriangle, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';

// ── Data ───────────────────────────────────────────────────────────────────────

const LOGOS = ['Acme Corp', 'AT&T', 'Instinet', 'Pathway', 'Windsurf', 'Glean'];

const FEATURE_CARDS = [
  {
    icon: MessageSquare,
    title: 'AI Contract Chat',
    body: 'Ask any question in plain English. Answers come with exact page citations from your document.',
  },
  {
    icon: FileSearch,
    title: 'Key Term Extraction',
    body: 'Every clause surfaced automatically — parties, dates, payment terms, liability caps, and more.',
  },
];

const MINI_FEATURES = [
  {
    icon: FileSearch,
    title: 'Term Extraction',
    body: 'Non-standard clauses detected and labelled before anyone signs.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Flagging',
    body: 'High-risk provisions surfaced with confidence scores before you sign.',
  },
  {
    icon: MessageSquare,
    title: 'Contract Chat',
    body: 'Ask follow-up questions. Get grounded answers with page references.',
  },
];

const STATS = [
  { value: '15 min', label: 'Average review time' },
  { value: '95%+', label: 'Extraction accuracy' },
  { value: '20+', label: 'Key terms per contract' },
  { value: '100%', label: 'Source-cited answers' },
];

const TESTIMONIALS = [
  {
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=280&h=320&fit=crop',
    quote: '"We went from a two-week contract turnaround to same day. The AI reviews everything that used to take our legal team hours."',
    name: 'Sarah Moore',
    role: 'Head of Legal, Acme Corp',
  },
  {
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=280&h=320&fit=crop',
    quote: '"ContractIQ gives our sales team the confidence to understand what they\'re signing. The chat feature is a game-changer."',
    name: 'James Park',
    role: 'VP Sales, Pathway',
  },
  {
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=280&h=320&fit=crop',
    quote: '"What used to take three days and expensive outside counsel now takes fifteen minutes. The confidence scores give us real clarity."',
    name: 'Priya Sharma',
    role: 'General Counsel, Instinet',
  },
];

const MOCK_TERMS = [
  { term: 'Confidentiality Period', value: '3 years', confidence: 'High' },
  { term: 'Governing Law', value: 'Delaware', confidence: 'High' },
  { term: 'Payment Terms', value: 'Net 30', confidence: 'Medium' },
  { term: 'Term Duration', value: '24 months', confidence: 'High' },
];

// ── Shared styles ──────────────────────────────────────────────────────────────

const S = {
  sectionPadding: { padding: '80px 64px' } as React.CSSProperties,
  sectionPaddingMobile: { padding: '60px 24px' } as React.CSSProperties,
  h2: { fontSize: 36, fontWeight: 700, lineHeight: '44px', letterSpacing: '-0.02em', color: '#080A0E' } as React.CSSProperties,
  h3: { fontSize: 30, fontWeight: 600, lineHeight: '38px', letterSpacing: '-0.02em', color: '#080A0E' } as React.CSSProperties,
  body: { fontSize: 16, fontWeight: 400, lineHeight: '26px', color: '#4A4C4F' } as React.CSSProperties,
  bodySmall: { fontSize: 14, fontWeight: 400, lineHeight: '22px', color: '#4A4C4F' } as React.CSSProperties,
  label: { fontSize: 14, fontWeight: 500, lineHeight: '20px', color: '#4A4C4F' } as React.CSSProperties,
};

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  height: 40, padding: '0 20px',
  background: '#125ACB', color: '#fff',
  fontSize: 14, fontWeight: 500, lineHeight: '20px',
  borderRadius: 6, border: '1px solid #125ACB',
  textDecoration: 'none', whiteSpace: 'nowrap',
};

const btnOutline: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  height: 40, padding: '0 20px',
  background: '#fff', color: '#080A0E',
  fontSize: 14, fontWeight: 500, lineHeight: '20px',
  borderRadius: 6, border: '1px solid #DADADB',
  textDecoration: 'none', whiteSpace: 'nowrap',
};

const btnOutlineBlue: React.CSSProperties = {
  ...btnOutline,
  color: '#125ACB',
  border: '1px solid #125ACB',
  background: 'transparent',
};

// ── Logo Strip ─────────────────────────────────────────────────────────────────

function LogoStrip() {
  return (
    <div style={{ borderTop: '1px solid #F0F0F1', borderBottom: '1px solid #F0F0F1', padding: '32px 64px', background: '#fff' }}>
      <p style={{ ...S.label, color: '#8F9193', textAlign: 'center', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
        Trusted by teams at leading companies
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
        {LOGOS.map((name) => (
          <span key={name} style={{ fontSize: 15, fontWeight: 600, color: '#DADADB', letterSpacing: '-0.01em' }}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Hero mock card ─────────────────────────────────────────────────────────────

function HeroMockCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #F0F0F1',
      borderRadius: 12,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 440,
    }}>
      {/* Card header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0F1', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#12A10D' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#080A0E' }}>Key Terms Dashboard</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8F9193' }}>NDA · 12 pages</span>
      </div>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', padding: '10px 20px', background: '#FAFAFA', borderBottom: '1px solid #F0F0F1' }}>
        {['Term', 'Value', 'Confidence'].map((h) => (
          <span key={h} style={{ fontSize: 11, fontWeight: 500, color: '#8F9193', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
        ))}
      </div>
      {/* Rows */}
      {MOCK_TERMS.map((row, i) => (
        <div key={row.term} style={{
          display: 'grid', gridTemplateColumns: '1fr 100px 80px',
          padding: '14px 20px',
          borderBottom: i < MOCK_TERMS.length - 1 ? '1px solid #F0F0F1' : 'none',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#080A0E' }}>{row.term}</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#080A0E', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', borderRadius: 999,
            fontSize: 12, fontWeight: 500,
            background: row.confidence === 'High' ? '#E7F7E7' : '#FFF9F0',
            color: row.confidence === 'High' ? '#0D720B' : '#B36800',
            border: row.confidence === 'High' ? '1px solid #92D490' : '1px solid #FFD294',
            width: 'fit-content',
          }}>
            {row.confidence}
          </span>
        </div>
      ))}
      {/* Footer */}
      <div style={{ padding: '12px 20px', background: '#E6EFFC', borderTop: '1px solid #D0E4FB' }}>
        <p style={{ fontSize: 12, color: '#0E469E', fontWeight: 500, margin: 0 }}>
          4 of 18 terms shown · Click any term to see source sentence
        </p>
      </div>
    </div>
  );
}

// ── Feature blue card ──────────────────────────────────────────────────────────

function FeatureBlueCard() {
  const blueTerms = [
    { term: 'Confidentiality', page: 'p.3', risk: 'Low' },
    { term: 'Liability', page: 'p.7', risk: 'High' },
    { term: 'Termination', page: 'p.9', risk: 'Medium' },
    { term: 'Payment Terms', page: 'p.4', risk: 'Low' },
    { term: 'Duration', page: 'p.2', risk: 'Low' },
  ];
  return (
    <div style={{ background: '#125ACB', borderRadius: 12, padding: 24, color: '#fff', width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          AI Contract Review
        </p>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: '26px' }}>
          Every clause analysed against your playbook.
        </p>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px', padding: '8px 16px', background: 'rgba(255,255,255,0.08)' }}>
          {['Clause', 'Page', 'Risk'].map((h) => (
            <span key={h} style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>
        {blueTerms.map((row, i) => (
          <div key={row.term} style={{
            display: 'grid', gridTemplateColumns: '1fr 60px 70px',
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{row.term}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{row.page}</span>
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: row.risk === 'High' ? '#FCA5A5' : row.risk === 'Medium' ? '#FCD34D' : '#86EFAC',
            }}>
              {row.risk}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 12 }}>
        Analysed in 47 sec · Confidence 94%
      </p>
    </div>
  );
}

// ── Chat mock (blue section) ───────────────────────────────────────────────────

function ChatMock() {
  const messages = [
    { from: 'user', text: 'What are the vendor contracts expiring in the next 60 days?' },
    { from: 'ai', text: 'Three contracts expire soon: NDA with Acme (Jun 2), MSA with Vendor X (Jun 8), NDA with FinCo (Jun 15).' },
    { from: 'user', text: 'Flag any auto-renewal clauses before deadline.' },
  ];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 16,
      padding: 24,
      maxWidth: 480,
      width: '100%',
      boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #F0F0F1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#125ACB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#080A0E' }}>AI Assistant</span>
        </div>
        <span style={{ fontSize: 12, color: '#8F9193' }}>+ New Chat</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: msg.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.from === 'user' ? '#125ACB' : '#F0F0F1',
              color: msg.from === 'user' ? '#fff' : '#080A0E',
              fontSize: 13, fontWeight: 400, lineHeight: '20px',
              maxWidth: '85%',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #DADADB' }}>
        <span style={{ fontSize: 13, color: '#8F9193', flex: 1 }}>Ask about your contract…</span>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#125ACB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={14} color="#fff" />
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#080A0E', fontFamily: "'Inter Display', system-ui, sans-serif" }}>

      {/* ── Announcement bar ── */}
      <div style={{ background: '#080A0E', padding: '10px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
          Trusted by legal teams to review NDA &amp; MSA contracts with AI-powered precision
        </p>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 64px', height: 56, borderBottom: '1px solid #F0F0F1',
        background: '#fff', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: '#125ACB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#080A0E', letterSpacing: '-0.02em' }}>ContractIQ</span>
          </Link>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Features', 'Pricing', 'How it works', 'Security'].map((item) => (
              <span key={item} style={{ fontSize: 14, fontWeight: 500, color: '#4A4C4F', cursor: 'pointer' }}>{item}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/sign-in" style={btnOutline}>Sign In</Link>
          <Link href="/sign-up" style={btnPrimary}>Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 48, padding: '80px 64px',
        alignItems: 'center', background: '#fff',
        borderBottom: '1px solid #F0F0F1',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            padding: '4px 12px', borderRadius: 999,
            background: '#E6EFFC', color: '#0E469E',
            fontSize: 13, fontWeight: 500,
          }}>
            AI-Powered Contract Review
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 700, lineHeight: '56px', letterSpacing: '-0.03em', color: '#080A0E', margin: 0 }}>
            Review Every NDA &amp; MSA<br />With AI.
          </h1>
          <p style={{ ...S.body, maxWidth: 480, margin: 0 }}>
            Upload a contract. Get every key term with its source sentence and confidence score. Ask questions in plain English — answers come only from your document.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={btnPrimary}>Get Started Free</Link>
            <Link href="#how" style={btnOutlineBlue}>See how it works</Link>
          </div>
          <p style={{ fontSize: 13, color: '#8F9193', margin: 0 }}>No credit card required · Results in under 2 minutes</p>
        </div>
        {/* Right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <HeroMockCard />
        </div>
      </section>

      {/* ── Logo strip ── */}
      <LogoStrip />

      {/* ── One Review. Fully Understood. ── */}
      <section id="how" style={{ ...S.sectionPadding, background: '#FAFAFA', borderBottom: '1px solid #F0F0F1' }}>
        <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 48 }}>One Review. Fully Understood.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: two stacked cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURE_CARDS.map(({ icon: Icon, title, body }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #F0F0F1', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E6EFFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color="#125ACB" />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#080A0E' }}>{title}</span>
                </div>
                <p style={{ ...S.bodySmall, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
          {/* Right: blue card */}
          <FeatureBlueCard />
        </div>
      </section>

      {/* ── Three mini features ── */}
      <section style={{ ...S.sectionPadding, background: '#fff', borderBottom: '1px solid #F0F0F1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {MINI_FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F0F0F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="#4A4C4F" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#080A0E', marginBottom: 6 }}>{title}</p>
                <p style={{ ...S.bodySmall, margin: 0 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats split ── */}
      <section style={{ ...S.sectionPadding, background: '#FAFAFA', borderBottom: '1px solid #F0F0F1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 style={{ ...S.h3, margin: 0 }}>AI That Reads Every Clause, Every Time.</h2>
            <p style={{ ...S.body, margin: 0 }}>
              Trusted by legal and business teams to surface contract risk from creation to renewal — with AI-powered intelligence on every term.
            </p>
            <div>
              <Link href="/sign-up" style={btnPrimary}>Request a demo <ArrowRight size={14} /></Link>
            </div>
          </div>
          {/* Right: stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 24, borderBottom: '1px solid #F0F0F1' }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: '#125ACB', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                <span style={{ ...S.bodySmall, flexShrink: 0 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blue CTA section ── */}
      <section style={{
        padding: '80px 64px',
        background: 'linear-gradient(135deg, #082A5E 0%, #125ACB 60%, #0E469E 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decorative circle */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', top: -200, right: -100, pointerEvents: 'none',
        }} />
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            AI Contract Review
          </p>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: '44px', letterSpacing: '-0.02em', marginBottom: 16 }}>
            AI Contract<br />Lifecycle Management
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: '26px', marginBottom: 24 }}>
            Streamline every stage of the contract lifecycle — from draft to approval, signature to renewal.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={{ ...btnPrimary, background: '#fff', color: '#125ACB', border: '1px solid #fff' }}>Get Started Free</Link>
            <Link href="/sign-in" style={{ ...btnOutline, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}>See our solution</Link>
          </div>
        </div>
        <ChatMock />
      </section>

      {/* ── Testimonials ── */}
      <section style={{ ...S.sectionPadding, background: '#fff', borderBottom: '1px solid #F0F0F1' }}>
        <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 48 }}>Trusted By Modern Legal Teams!</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {TESTIMONIALS.map(({ photo, quote, name, role }) => (
            <div key={name} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #F0F0F1', position: 'relative' }}>
              <img
                src={photo}
                alt={name}
                style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(8,10,14,0.9) 0%, rgba(8,10,14,0.4) 60%, transparent 100%)',
                padding: 20,
              }}>
                <p style={{ fontSize: 13, fontWeight: 400, color: '#fff', lineHeight: '20px', marginBottom: 8 }}>{quote}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>{name}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Logo strip 2 ── */}
      <LogoStrip />

      {/* ── FAQ ── */}
      <section style={{ ...S.sectionPadding, background: '#fff', borderBottom: '1px solid #F0F0F1' }}>
        <h2 style={{ ...S.h2, textAlign: 'center', marginBottom: 48 }}>Frequently Asked Questions</h2>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F1', padding: '48px 64px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: '#125ACB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={13} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#080A0E' }}>ContractIQ</span>
            </Link>
            <p style={{ fontSize: 13, color: '#4A4C4F', lineHeight: '20px', maxWidth: 240 }}>
              Draft, review, negotiate, approve, and renew — one intelligent workspace that handles the entire contract lifecycle, so your legal team can focus on judgment, not paperwork.
            </p>
          </div>
          {/* Product */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#080A0E', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Overview', 'NDA Review', 'MSA Review', 'Contract Chat', 'Pricing', 'Enterprise Portfolio'].map((item) => (
                <span key={item} style={{ fontSize: 13, color: '#4A4C4F', cursor: 'pointer' }}>{item}</span>
              ))}
            </div>
          </div>
          {/* Developers */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#080A0E', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Developers</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Docs', 'SDK & Templates', 'Changelog', 'API Reference', 'Run a Webhook'].map((item) => (
                <span key={item} style={{ fontSize: 13, color: '#4A4C4F', cursor: 'pointer' }}>{item}</span>
              ))}
            </div>
          </div>
          {/* Company */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#080A0E', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['About', 'Careers · 3 open', 'Blog', 'Security', 'Press'].map((item) => (
                <span key={item} style={{ fontSize: 13, color: '#4A4C4F', cursor: 'pointer' }}>{item}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #F0F0F1', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#8F9193', margin: 0 }}>© ContractIQ 2026 · All Rights Reserved</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/legal/terms" style={{ fontSize: 12, color: '#8F9193', textDecoration: 'none' }}>Terms</Link>
            <Link href="/legal/privacy" style={{ fontSize: 12, color: '#8F9193', textDecoration: 'none' }}>Privacy</Link>
            <span style={{ fontSize: 12, color: '#8F9193' }}>Powered by Microsoft Azure AI Foundry</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
