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
import { useLang } from '../i18n/LanguageContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { FamilyFigure, HandoverScene, SkylineScene } from '../components/illustrations'

export default function LandingPage() {
  const { user } = useAuth()
  const { t } = useLang()

  const painPoints = [
    { icon: FileQuestion, title: t('landing.p1Title'), text: t('landing.p1Text') },
    { icon: AlertOctagon, title: t('landing.p2Title'), text: t('landing.p2Text') },
    { icon: MessagesSquare, title: t('landing.p3Title'), text: t('landing.p3Text') },
  ]

  const features = [
    { icon: ScanText, title: t('landing.f1Title'), text: t('landing.f1Text') },
    { icon: ShieldCheck, title: t('landing.f2Title'), text: t('landing.f2Text') },
    { icon: ClipboardList, title: t('landing.f3Title'), text: t('landing.f3Text') },
    { icon: Pill, title: t('landing.f4Title'), text: t('landing.f4Text') },
    { icon: Activity, title: t('landing.f5Title'), text: t('landing.f5Text') },
    { icon: MessageCircle, title: t('landing.f6Title'), text: t('landing.f6Text') },
  ]

  const steps = [
    { n: '1', title: t('landing.s1Title'), text: t('landing.s1Text') },
    { n: '2', title: t('landing.s2Title'), text: t('landing.s2Text') },
    { n: '3', title: t('landing.s3Title'), text: t('landing.s3Text') },
  ]

  const familyBlocks = [
    {
      variant: 'self' as const,
      bg: undefined,
      cardClass: 'border border-stone-200/80 bg-white',
      eyebrowStyle: undefined,
      eyebrowClass: 'text-teal-700',
      titleStyle: undefined,
      titleClass: 'text-pine-900',
      textStyle: undefined,
      textClass: 'text-stone-500',
      checkColor: undefined,
      checkClass: 'text-teal-600',
      eyebrow: t('landing.selfEyebrow'),
      title: t('landing.selfTitle'),
      story: t('landing.selfStory'),
      bullets: [t('landing.selfB1'), t('landing.selfB2'), t('landing.selfB3')],
      caption: t('landing.selfCaption'),
      captionStyle: undefined,
      captionClass: 'text-pine-800/70',
      flip: false,
    },
    {
      variant: 'child' as const,
      bg: '#eef2fc',
      cardClass: '',
      eyebrowStyle: { color: '#4f74d9' },
      eyebrowClass: '',
      titleStyle: { color: '#27367a' },
      titleClass: '',
      textStyle: { color: '#4a5578' },
      textClass: '',
      checkColor: '#4f74d9',
      checkClass: '',
      eyebrow: t('landing.childEyebrow'),
      title: t('landing.childTitle'),
      story: t('landing.childStory'),
      bullets: [t('landing.childB1'), t('landing.childB2'), t('landing.childB3')],
      caption: t('landing.childCaption'),
      captionStyle: { color: '#27367aB3' },
      captionClass: '',
      flip: true,
    },
    {
      variant: 'parent' as const,
      bg: '#f7f0e7',
      cardClass: '',
      eyebrowStyle: { color: '#a86f4f' },
      eyebrowClass: '',
      titleStyle: { color: '#4a3242' },
      titleClass: '',
      textStyle: { color: '#6b5560' },
      textClass: '',
      checkColor: '#a86f4f',
      checkClass: '',
      eyebrow: t('landing.parentEyebrow'),
      title: t('landing.parentTitle'),
      story: t('landing.parentStory'),
      bullets: [t('landing.parentB1'), t('landing.parentB2'), t('landing.parentB3')],
      caption: t('landing.parentCaption'),
      captionStyle: { color: '#4a3242B3' },
      captionClass: '',
      flip: false,
    },
  ]

  return (
    <div className="min-h-screen bg-paper">
      {/* Sticky top nav */}
      <header className="sticky top-0 z-20 border-b border-stone-200/60 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse className="anim-heartbeat h-7 w-7 text-teal-600" strokeWidth={2} />
            <span className="font-display text-[22px] font-semibold text-pine-900">Curastra</span>
          </Link>
          <nav className="flex items-center gap-2.5">
            <LanguageSwitcher />
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-700/40 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                {t('nav.openApp')} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-pine-900 transition-colors hover:bg-sage-100"
                >
                  {t('nav.signin')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-700/40 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
                >
                  {t('nav.getStarted')} <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="anim-drift pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
        <div
          className="anim-drift pointer-events-none absolute bottom-[-20%] left-[-5%] h-80 w-80 rounded-full bg-sage-200/60 blur-3xl"
          style={{ animationDelay: '-9s' }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <div className="anim-fade-up inline-flex items-center gap-1.5 rounded-full border border-teal-600/25 bg-white px-3 py-1 text-xs font-medium text-teal-700">
              <Sparkles className="h-3.5 w-3.5" /> {t('landing.badge')}
            </div>
            <h1 className="anim-fade-up anim-delay-1 mt-5 font-display text-5xl font-medium leading-[1.08] text-pine-900 sm:text-6xl">
              {t('landing.heroTitle1')}
              <br />
              {t('landing.heroTitle2')}
            </h1>
            <p className="anim-fade-up anim-delay-2 mt-6 max-w-lg text-lg leading-relaxed text-stone-600">
              {t('landing.heroSub')}
            </p>
            <div className="anim-fade-up anim-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl border border-teal-700/40 bg-teal-600 px-6 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md"
              >
                {t('landing.try')} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-[15px] font-medium text-pine-900 transition-colors hover:border-pine-800"
              >
                {t('landing.how')}
              </a>
            </div>
            <p className="anim-fade-up anim-delay-4 mt-6 flex items-center gap-1.5 text-xs text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('landing.trust')}
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
              <div className="anim-float-slow absolute -bottom-16 -left-8 w-72 rounded-2xl border border-stone-200 bg-pine-900 p-4 shadow-[0_24px_60px_rgba(31,45,41,0.18)]">
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
              <p className="font-display text-sm italic text-pine-800/70">{t('landing.handoverCaption')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="border-y border-stone-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              {t('landing.problemEyebrow')}
            </div>
            <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
              {t('landing.problemTitle')}
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

      {/* One home for the whole family's care */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
            {t('landing.familyEyebrow')}
          </div>
          <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
            {t('landing.familyTitle')}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-500">{t('landing.familySub')}</p>
        </div>

        <div className="mt-10 space-y-6">
          {familyBlocks.map((b) => (
            <div
              key={b.variant}
              className={`anim-fade-up overflow-hidden rounded-3xl ${b.cardClass}`}
              style={b.bg ? { backgroundColor: b.bg } : undefined}
            >
              <div className="grid items-center lg:grid-cols-2">
                <div
                  className={`flex h-full flex-col justify-end overflow-hidden ${
                    b.flip ? 'order-2 pr-6 lg:order-1' : 'pl-6'
                  }`}
                >
                  <div className="flex flex-col items-center pt-8">
                    <FamilyFigure variant={b.variant} className="h-44 w-auto" />
                    <p className={`mb-2 font-display text-sm italic ${b.captionClass}`} style={b.captionStyle}>
                      {b.caption}
                    </p>
                  </div>
                  <SkylineScene variant={b.variant} className="w-full min-w-[560px] translate-y-1" />
                </div>
                <div className={`p-8 sm:p-12 ${b.flip ? 'order-1 lg:order-2' : ''}`}>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${b.eyebrowClass}`}
                    style={b.eyebrowStyle}
                  >
                    {b.eyebrow}
                  </div>
                  <h3 className={`mt-2 font-display text-2xl font-medium sm:text-3xl ${b.titleClass}`} style={b.titleStyle}>
                    {b.title}
                  </h3>
                  <p className={`mt-3 text-[15px] leading-relaxed ${b.textClass}`} style={b.textStyle}>
                    {b.story}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {b.bullets.map((bullet) => (
                      <li key={bullet} className={`flex items-start gap-2.5 text-sm ${b.textClass}`} style={b.textStyle}>
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${b.checkClass}`}
                          style={b.checkColor ? { color: b.checkColor } : undefined}
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Everything included */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-3xl border border-stone-200/80 bg-white p-8 sm:p-10">
          <h2 className="font-display text-2xl font-medium text-pine-900">{t('landing.includedTitle')}</h2>
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-300">
              {t('landing.stepsEyebrow')}
            </div>
            <h2 className="mt-2 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              {t('landing.stepsTitle')}
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
            {t('landing.safety')}
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
          {t('landing.ctaTitle1')}
          <br />
          {t('landing.ctaTitle2')}
        </h2>
        <div className="mt-8">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-700/40 bg-teal-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md"
          >
            {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-stone-400 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-teal-600" />
            <span className="font-display text-sm text-pine-900">Curastra</span>
            <span>· {t('chrome.tagline')}</span>
          </div>
          <div>{t('landing.footerNote')}</div>
        </div>
      </footer>
    </div>
  )
}
