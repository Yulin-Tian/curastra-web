import { Link } from 'react-router-dom'
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  HeartPulse,
  MessageCircle,
  MessagesSquare,
  Pill,
  ScanText,
  ShieldCheck,
  Sparkles,
  Activity,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const painPoints = [
  {
    icon: FileQuestion,
    title: 'Prescriptions live on paper',
    text: 'Photos get lost in the gallery, handwriting is hard to read, and "Tab Pan 40 OD AC" means nothing at the kitchen table.',
  },
  {
    icon: AlertOctagon,
    title: 'Instructions don’t stick',
    text: 'Doses get missed or doubled, follow-ups are forgotten, and warning signs go unrecognised until they become emergencies.',
  },
  {
    icon: MessagesSquare,
    title: 'No one to ask at 9 pm',
    text: 'Small worries either get ignored or turn into anxious internet searches — neither is care.',
  },
]

const features = [
  {
    icon: ScanText,
    title: 'Scan any prescription',
    text: 'Photos, PDFs, or documents — the text is extracted for you in seconds.',
  },
  {
    icon: ShieldCheck,
    title: 'You stay in control',
    text: 'You read, correct, and confirm every extracted word before any AI uses it.',
  },
  {
    icon: ClipboardList,
    title: 'Clear after-care plans',
    text: 'Medications, daily tasks, and warning signs — structured, plain, and traceable.',
  },
  {
    icon: Pill,
    title: 'Medication safety checks',
    text: 'Duplicates and risky interactions across everything you take, flagged early.',
  },
  {
    icon: Activity,
    title: 'Vitals & gentle insights',
    text: 'Log blood pressure, glucose, or weight and see what your readings are saying.',
  },
  {
    icon: MessageCircle,
    title: 'An assistant that knows you',
    text: 'Ask anything about your medicines, plan, or readings — it escalates real emergencies to a doctor.',
  },
]

const steps = [
  { n: '1', title: 'Upload', text: 'Snap or upload the prescription from your visit.' },
  {
    n: '2',
    title: 'Review & confirm',
    text: 'Check the extracted text yourself — nothing proceeds without your confirmation.',
  },
  { n: '3', title: 'Live your plan', text: 'A clear care plan, safety checks, and an assistant for the days after.' },
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-paper">
      {/* Sticky top nav */}
      <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse className="h-7 w-7 text-teal-600" strokeWidth={1.8} />
            <span className="font-display text-xl font-medium text-pine-900">Curastra</span>
          </Link>
          <nav className="flex items-center gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                Open the app <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-pine-900 transition-colors hover:bg-sage-100"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Drifting color washes */}
        <div className="anim-drift pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
        <div
          className="anim-drift pointer-events-none absolute bottom-[-20%] left-[-5%] h-80 w-80 rounded-full bg-sage-200/60 blur-3xl"
          style={{ animationDelay: '-9s' }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <div className="anim-fade-up inline-flex items-center gap-1.5 rounded-full border border-teal-600/25 bg-white px-3 py-1 text-xs font-medium text-teal-700">
              <Sparkles className="h-3.5 w-3.5" /> AI-supported everyday care
            </div>
            <h1 className="anim-fade-up anim-delay-1 mt-5 font-display text-5xl font-medium leading-[1.08] text-pine-900 sm:text-6xl">
              Care shouldn&rsquo;t end
              <br />
              when the visit does.
            </h1>
            <p className="anim-fade-up anim-delay-2 mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
              After the consultation comes the hard part: understanding the prescription, remembering
              the doses, knowing what&rsquo;s normal. Curastra turns the paper you walk out with into a
              plan you can actually follow.
            </p>
            <div className="anim-fade-up anim-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(13,148,136,0.25)] transition-all hover:-translate-y-0.5 hover:bg-teal-700"
              >
                Try Curastra <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-[15px] font-medium text-pine-900 transition-colors hover:border-pine-800"
              >
                See how it works
              </a>
            </div>
            <p className="anim-fade-up anim-delay-4 mt-6 flex items-center gap-1.5 text-xs text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Non-diagnostic by design. You confirm everything the AI reads.
            </p>
          </div>

          {/* Floating product mock, built from the design system itself */}
          <div className="relative hidden lg:block">
            <div className="anim-float rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(31,45,41,0.10)]">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                <ClipboardList className="h-4 w-4" /> Care plan · today
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ['Pantoprazole 40 mg', 'Before breakfast'],
                  ['Amoxicillin 500 mg', 'Every 8 hours · 5 days'],
                  ['Drink 2–3 L water', 'Throughout the day'],
                ].map(([name, when]) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl bg-sage-50 px-3.5 py-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-teal-600" />
                    <div>
                      <div className="text-[13.5px] font-medium text-pine-900">{name}</div>
                      <div className="text-xs text-stone-500">{when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="anim-float-slow absolute -bottom-10 -left-8 w-72 rounded-2xl border border-stone-200 bg-pine-900 p-4 shadow-[0_24px_60px_rgba(31,45,41,0.18)]">
              <div className="text-xs text-sage-200/70">You asked</div>
              <div className="mt-1 text-sm text-white">&ldquo;Can I take it with food?&rdquo;</div>
              <div className="mt-3 rounded-xl bg-white/10 p-3 text-[13px] leading-relaxed text-sage-100">
                Pantoprazole works best about 30 minutes <em>before</em> breakfast — that&rsquo;s why your
                plan says before food.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="border-y border-stone-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">The problem</div>
            <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
              The moment care usually breaks down
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painPoints.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-stone-200/80 bg-paper p-6">
                <span className="inline-flex rounded-xl bg-sage-100 p-2.5">
                  <Icon className="h-5 w-5 text-pine-800" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-pine-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Curastra offers */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">What you get</div>
          <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
            Everything the days after a visit need
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border border-stone-200/80 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-teal-600/40"
            >
              <span className="inline-flex rounded-xl bg-pine-900 p-2.5">
                <Icon className="h-5 w-5 text-teal-300" strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 font-display text-lg font-medium text-pine-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-stone-200/60 bg-pine-900">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-300">How it works</div>
            <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              Three steps, and you approve each one
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ n, title, text }) => (
              <div key={n} className="rounded-2xl bg-white/5 p-6">
                <div className="font-display text-4xl font-medium text-teal-300">{n}</div>
                <h3 className="mt-3 font-display text-lg font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-sage-100/70">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 flex items-start gap-2 text-sm text-sage-100/70">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
            Built to support, never to diagnose. Curastra never prescribes or changes a dose, shows a
            disclaimer with every AI result, and tells you clearly when something needs a real doctor.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24 text-center sm:px-8">
        <h2 className="font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
          Bring your last prescription.
          <br />
          See what it becomes.
        </h2>
        <div className="mt-8">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_24px_rgba(13,148,136,0.25)] transition-all hover:-translate-y-0.5 hover:bg-teal-700"
          >
            Get started — it&rsquo;s free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-stone-400 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-teal-600" />
            <span className="font-display text-sm text-pine-900">Curastra</span>
            <span>· Everyday care, continued</span>
          </div>
          <div>An academic capstone project (BITS Pilani, Group 110). Not a medical device.</div>
        </div>
      </footer>
    </div>
  )
}
