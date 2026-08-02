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
import { FamilyFigure, HandoverScene, SkylineScene } from '../components/illustrations'

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
    text: 'Small worries either get ignored or turn into anxious internet searches. Neither is care.',
  },
]

const features = [
  {
    icon: ScanText,
    title: 'Scan any prescription',
    text: 'Photos, PDFs, or documents. The text is extracted for you in seconds.',
  },
  {
    icon: ShieldCheck,
    title: 'You stay in control',
    text: 'You read, correct, and confirm every extracted word before any AI uses it.',
  },
  {
    icon: ClipboardList,
    title: 'Clear after-care plans',
    text: 'Medications, daily tasks, and warning signs in a plan that stays traceable to your prescription.',
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
    text: 'Ask anything about your medicines, plan, or readings. Real emergencies are escalated to a doctor.',
  },
]

const steps = [
  { n: '1', title: 'Upload', text: 'Snap or upload the prescription from your visit.' },
  {
    n: '2',
    title: 'Review & confirm',
    text: 'Check the extracted text yourself. Nothing proceeds without your confirmation.',
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
            <HeartPulse className="h-7 w-7 text-teal-600" strokeWidth={2} />
            <span className="font-display text-[22px] font-semibold text-pine-900">Curastra</span>
          </Link>
          <nav className="flex items-center gap-2.5">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-700/40 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-700/40 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
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
                className="inline-flex items-center gap-2 rounded-xl border border-teal-700/40 bg-teal-600 px-6 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md"
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
          <div className="hidden lg:block">
            <div className="relative">
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
            <div className="anim-float-slow absolute -bottom-6 -left-8 w-72 rounded-2xl border border-stone-200 bg-pine-900 p-4 shadow-[0_24px_60px_rgba(31,45,41,0.18)]">
              <div className="text-xs text-sage-200/70">You asked</div>
              <div className="mt-1 text-sm text-white">&ldquo;Can I take it with food?&rdquo;</div>
              <div className="mt-3 rounded-xl bg-white/10 p-3 text-[13px] leading-relaxed text-sage-100">
                Pantoprazole works best about 30 minutes <em>before</em> breakfast, which is why your
                plan says before food.
              </div>
            </div>
            </div>
            <div className="mt-24 flex flex-col items-center">
              <HandoverScene className="anim-fade-up anim-delay-4 h-44 w-auto" />
              <p className="font-display text-sm italic text-pine-800/70">
                The visit ends. Curastra carries it on.
              </p>
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

      {/* One home for the whole family's care — the three-story centerpiece */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            For the whole family
          </div>
          <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
            One home for everyone&rsquo;s care
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
            Care rarely stops at yourself. Add the people who depend on you. Each keeps their own
            records, plans, medicines, and ABHA, and the whole app changes its colors to match who
            you are caring for.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {/* Self */}
          <div className="anim-fade-up overflow-hidden rounded-3xl border border-stone-200/80 bg-white">
            <div className="grid items-center lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                  For yourself
                </div>
                <h3 className="mt-2 font-display text-2xl font-medium text-pine-900 sm:text-3xl">
                  Your own recovery, made followable
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
                  You leave the clinic with a prescription and a headful of instructions. Scan it,
                  confirm what was read, and live the days after with a plan instead of a guess.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'Scan any prescription; you confirm every extracted word',
                    'Daily tasks you tick off, with progress you can see',
                    'An assistant that knows your medicines and readings',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-stone-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex h-full flex-col justify-end overflow-hidden pl-6">
                <div className="flex flex-col items-center pt-8">
                  <FamilyFigure variant="self" className="h-44 w-auto" />
                  <p className="mb-2 font-display text-sm italic text-pine-800/70">
                    Recovery, with a plan in hand.
                  </p>
                </div>
                <SkylineScene variant="self" className="w-full min-w-[560px] translate-y-1" />
              </div>
            </div>
          </div>

          {/* Child */}
          <div className="anim-fade-up overflow-hidden rounded-3xl" style={{ backgroundColor: '#eef2fc' }}>
            <div className="grid items-center lg:grid-cols-2">
              <div className="order-2 flex h-full flex-col justify-end overflow-hidden pr-6 lg:order-1">
                <div className="flex flex-col items-center pt-8">
                  <FamilyFigure variant="child" className="h-44 w-auto" />
                  <p className="mb-2 font-display text-sm italic" style={{ color: '#27367aB3' }}>
                    Small hands, held steady.
                  </p>
                </div>
                <SkylineScene variant="child" className="w-full min-w-[560px] translate-y-1" />
              </div>
              <div className="order-1 p-8 sm:p-12 lg:order-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#4f74d9' }}>
                  For your children
                </div>
                <h3 className="mt-2 font-display text-2xl font-medium sm:text-3xl" style={{ color: '#27367a' }}>
                  Small patients, zero guesswork
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: '#4a5578' }}>
                  A fever at midnight, a crumpled prescription from the paediatrician, and a dose
                  you&rsquo;d rather not get wrong. Your child&rsquo;s own profile keeps their
                  medicines separate from yours, explained in words tired parents can follow.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'A separate profile with their own records and ABHA',
                    'Doses and instructions rewritten in plain language',
                    'Safety checks tuned to exactly what they take',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: '#4a5578' }}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#4f74d9' }} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Parent */}
          <div className="anim-fade-up overflow-hidden rounded-3xl" style={{ backgroundColor: '#f7f0e7' }}>
            <div className="grid items-center lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#a86f4f' }}>
                  For your parents
                </div>
                <h3 className="mt-2 font-display text-2xl font-medium sm:text-3xl" style={{ color: '#4a3242' }}>
                  Their care, gently in view
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: '#6b5560' }}>
                  Three medicines, two doctors, and a blood-pressure diary nobody keeps. Give your
                  parents a profile of their own and watch the trends instead of worrying in the
                  dark, with warnings that name the medicine rather than vague alarm.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'Their prescriptions and follow-ups in one place',
                    'Blood pressure and glucose trends you can actually see',
                    'Cross-medication safety checks across everything they take',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm" style={{ color: '#6b5560' }}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#a86f4f' }} /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex h-full flex-col justify-end overflow-hidden pl-6">
                <div className="flex flex-col items-center pt-8">
                  <FamilyFigure variant="parent" className="h-44 w-auto" />
                  <p className="mb-2 font-display text-sm italic" style={{ color: '#4a3242B3' }}>
                    Walking beside them, gently.
                  </p>
                </div>
                <SkylineScene variant="parent" className="w-full min-w-[560px] translate-y-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything included — compact, not boxy */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-8 sm:p-10">
          <h2 className="font-display text-2xl font-medium text-pine-900">Everything included</h2>
          <div className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex shrink-0 rounded-lg bg-sage-100 p-1.5">
                  <Icon className="h-4 w-4 text-pine-800" strokeWidth={1.8} />
                </span>
                <p className="text-sm leading-relaxed text-stone-600">
                  <span className="font-medium text-pine-900">{title}.</span> {text}
                </p>
              </div>
            ))}
          </div>
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

      {/* Illustrated scene */}
      <div className="overflow-hidden">
        <SkylineScene className="mx-auto -mb-1 mt-16 w-full min-w-[900px] max-w-7xl" />
      </div>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-16 text-center sm:px-8">
        <h2 className="font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
          Bring your last prescription.
          <br />
          See what it becomes.
        </h2>
        <div className="mt-8">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-700/40 bg-teal-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md"
          >
            Get started for free <ArrowRight className="h-4 w-4" />
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
          <div>An academic capstone project (BITS Pilani, Group 97). Not a medical device.</div>
        </div>
      </footer>
    </div>
  )
}
