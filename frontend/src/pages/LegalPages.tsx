import { Link } from 'react-router-dom'
import { ArrowLeft, HeartPulse } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

interface Section {
  title: string
  body: string
}

function LegalShell({ title, updated, sections }: { title: string; updated: string; sections: Section[] }) {
  const { t } = useLang()
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-teal-600" />
            <span className="text-xl font-semibold tracking-tight text-slate-900">Curastra</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> {t('legal.back')}
          </Link>
        </div>
        <h1 className="font-display text-3xl font-medium text-pine-900">{title}</h1>
        <p className="mt-1 text-sm text-stone-400">{updated}</p>
        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-semibold text-slate-800">{s.title}</h2>
              <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

const PRIVACY: Record<'en' | 'hi', { title: string; updated: string; sections: Section[] }> = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: 8 August 2026',
    sections: [
      {
        title: 'What Curastra is',
        body: 'Curastra is a personal health assistant that helps you act on your care after a medical consultation. It is not a medical device and does not provide medical advice. Because health information is sensitive, this policy explains plainly what we collect, why, and what control you keep.',
      },
      {
        title: 'What we collect',
        body: 'Your account details (name, email, password stored only as a bcrypt hash); optional health basics (date of birth, height, weight, blood type, allergies, conditions, emergency contact); documents you upload (prescriptions, lab reports) and the text you confirm from them; care plans generated from that text; your medicines, readings, and conversations with the assistant; family profiles you create; and, if you link ABHA, your ABHA number and address. We never see or store your Aadhaar number — it passes through to the official gateway and is not retained or logged.',
      },
      {
        title: 'Why we collect it',
        body: 'Solely to provide the product to you: generating care plans, answering your questions in context, tracking adherence, sending reminders you asked for, and showing your own trends. We do not sell data, show advertising, or use your health information for any other purpose.',
      },
      {
        title: 'AI processing',
        body: 'Care-plan generation, simplification, safety checks, insights, and chat use OpenAI models through our own AI engine. Only the text needed for your request is sent; results carry safety guardrails (non-diagnostic, refusal of treatment requests). Nothing is used to train third-party models under the API terms we use.',
      },
      {
        title: 'Who processes data for us',
        body: 'Render (hosting and database), OpenAI (AI processing as described), the official ABDM gateway operated by our team service for ABHA enrollment, Resend (transactional email for password recovery), and Google Fonts (typeface delivery). Each receives only what its function requires.',
      },
      {
        title: 'Sharing you control',
        body: 'Data leaves your account only when you act: creating a read-only share link (revocable, 30-day expiry), printing, or downloading your export. Family profiles are visible only within your account.',
      },
      {
        title: 'Security',
        body: 'Transport encryption (TLS) everywhere, bcrypt password hashing, optional two-factor authentication, brute-force rate limiting, strict browser security headers, single-use hashed recovery codes, and isolation between accounts verified by automated tests.',
      },
      {
        title: 'Your rights',
        body: 'Access and correction: everything is visible and editable in the app. Portability: download your complete data as JSON from Profile. Erasure: delete your account from Profile — after re-proving your credentials, every record is permanently removed. Consent: recorded when you register; withdraw it at any time by deleting your account.',
      },
      {
        title: 'Retention',
        body: 'We keep your data only while your account exists. Deleting your account removes it immediately and permanently; there is no recovery period.',
      },
      {
        title: 'Contact',
        body: 'Questions about this policy: tianyulin819@gmail.com. If we change this policy, the date above changes and material changes will be announced in the app.',
      },
    ],
  },
  hi: {
    title: 'गोपनीयता नीति',
    updated: 'अंतिम अद्यतन: 8 अगस्त 2026',
    sections: [
      {
        title: 'Curastra क्या है',
        body: 'Curastra एक व्यक्तिगत स्वास्थ्य सहायक है जो परामर्श के बाद आपकी देखभाल में मदद करता है। यह चिकित्सा उपकरण नहीं है और चिकित्सा सलाह नहीं देता। स्वास्थ्य जानकारी संवेदनशील होती है, इसलिए यह नीति साफ़ शब्दों में बताती है कि हम क्या एकत्र करते हैं, क्यों, और आपका नियंत्रण क्या रहता है।',
      },
      {
        title: 'हम क्या एकत्र करते हैं',
        body: 'आपके खाते का विवरण (नाम, ईमेल, पासवर्ड केवल bcrypt हैश के रूप में); वैकल्पिक स्वास्थ्य जानकारी (जन्मतिथि, ऊँचाई, वज़न, रक्त समूह, एलर्जी, स्थितियाँ, आपातकालीन संपर्क); आपके अपलोड किए दस्तावेज़ और पुष्टि किया गया टेक्स्ट; उनसे बने केयर प्लान; दवाएँ, रीडिंग और सहायक से बातचीत; पारिवारिक प्रोफ़ाइल; और ABHA लिंक करने पर ABHA नंबर व पता। आपका आधार नंबर हम कभी संग्रहीत नहीं करते — वह केवल आधिकारिक गेटवे तक जाता है।',
      },
      {
        title: 'क्यों एकत्र करते हैं',
        body: 'केवल आपको सेवा देने के लिए: केयर प्लान बनाना, संदर्भ में सवालों के जवाब, पालन ट्रैकिंग, आपके चुने रिमाइंडर और आपके रुझान दिखाना। हम डेटा नहीं बेचते, विज्ञापन नहीं दिखाते, और स्वास्थ्य जानकारी का कोई अन्य उपयोग नहीं करते।',
      },
      {
        title: 'AI प्रोसेसिंग',
        body: 'केयर प्लान, सरलीकरण, सुरक्षा जाँच, इनसाइट और चैट हमारे AI इंजन के ज़रिए OpenAI मॉडल का उपयोग करते हैं। केवल आवश्यक टेक्स्ट भेजा जाता है; परिणामों पर सुरक्षा नियम लागू रहते हैं (निदान नहीं, उपचार अनुरोध अस्वीकार)। हमारे API शर्तों के तहत आपका डेटा मॉडल प्रशिक्षण में उपयोग नहीं होता।',
      },
      {
        title: 'हमारे लिए डेटा कौन प्रोसेस करता है',
        body: 'Render (होस्टिंग व डेटाबेस), OpenAI (AI प्रोसेसिंग), ABHA नामांकन के लिए आधिकारिक ABDM गेटवे, Resend (पासवर्ड रिकवरी ईमेल) और Google Fonts (फ़ॉन्ट)। हर सेवा को केवल उतना ही मिलता है जितना उसके कार्य के लिए आवश्यक है।',
      },
      {
        title: 'साझाकरण आपके नियंत्रण में',
        body: 'डेटा आपके खाते से केवल आपके कार्य से बाहर जाता है: केवल-पढ़ने योग्य साझा लिंक (रद्द करने योग्य, 30 दिन), प्रिंट, या एक्सपोर्ट डाउनलोड। पारिवारिक प्रोफ़ाइल केवल आपके खाते में दिखती हैं।',
      },
      {
        title: 'सुरक्षा',
        body: 'हर जगह TLS एन्क्रिप्शन, bcrypt पासवर्ड हैशिंग, वैकल्पिक 2FA, ब्रूट-फ़ोर्स सीमाएँ, सख़्त ब्राउज़र सुरक्षा हेडर, एकल-उपयोग रिकवरी कोड, और स्वचालित परीक्षणों से प्रमाणित खातों का अलगाव।',
      },
      {
        title: 'आपके अधिकार',
        body: 'पहुँच व सुधार: सब कुछ ऐप में दिखता और संपादित होता है। पोर्टेबिलिटी: प्रोफ़ाइल से पूरा डेटा JSON में डाउनलोड करें। मिटाने का अधिकार: प्रोफ़ाइल से खाता हटाएँ — पहचान की पुष्टि के बाद सब कुछ स्थायी रूप से हट जाता है। सहमति: पंजीकरण पर दर्ज होती है; खाता हटाकर कभी भी वापस लें।',
      },
      {
        title: 'अवधारण',
        body: 'डेटा केवल खाता रहने तक रहता है। खाता हटाते ही सब तुरंत और स्थायी रूप से हट जाता है; कोई पुनर्प्राप्ति अवधि नहीं है।',
      },
      {
        title: 'संपर्क',
        body: 'इस नीति के बारे में प्रश्न: tianyulin819@gmail.com। नीति बदलने पर ऊपर की तिथि बदलेगी और बड़े बदलाव ऐप में बताए जाएँगे।',
      },
    ],
  },
}

const TERMS: Record<'en' | 'hi', { title: string; updated: string; sections: Section[] }> = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: 8 August 2026',
    sections: [
      {
        title: 'The service',
        body: 'Curastra helps you organise and act on your everyday care: digitising prescriptions, generating structured after-care plans, tracking medicines and readings, and answering questions grounded in your own record. By creating an account you accept these terms and the Privacy Policy.',
      },
      {
        title: 'Not medical advice',
        body: 'Curastra is not a medical device, does not diagnose, and never replaces your doctor. AI outputs are informational, carry deliberate safety limits, and can be wrong — always confirm important decisions with a clinician. In an emergency, contact emergency services (112 in India) immediately; do not rely on the app.',
      },
      {
        title: 'Your account',
        body: 'You are responsible for the accuracy of what you upload and confirm — the review-and-confirm step exists precisely so no AI acts on unverified text. Keep your credentials safe; enabling two-factor authentication is strongly recommended. Family profiles you create are managed under your responsibility.',
      },
      {
        title: 'Acceptable use',
        body: "Do not use Curastra to store another person's data without their knowledge, to probe or disrupt the service, or for any unlawful purpose. Share links you create are your responsibility — anyone holding the link can view that summary until it expires or you revoke it.",
      },
      {
        title: 'Availability',
        body: 'Curastra is provided as-is, currently operated as an academic-grade product without a formal service-level agreement. We work to keep it available and your data safe, but interruptions and changes to features can happen.',
      },
      {
        title: 'Liability',
        body: 'To the maximum extent permitted by law, Curastra and its operators are not liable for damages arising from use of the service, including decisions made on the basis of AI-generated content. Nothing in these terms limits liability that cannot lawfully be limited.',
      },
      {
        title: 'Ending the relationship',
        body: 'You can delete your account at any time from Profile; deletion is immediate and permanent. We may suspend accounts that abuse the service. These terms may evolve; the date above tracks the current version.',
      },
      {
        title: 'Contact',
        body: 'Questions about these terms: tianyulin819@gmail.com.',
      },
    ],
  },
  hi: {
    title: 'सेवा की शर्तें',
    updated: 'अंतिम अद्यतन: 8 अगस्त 2026',
    sections: [
      {
        title: 'सेवा',
        body: 'Curastra रोज़मर्रा की देखभाल व्यवस्थित करने में मदद करता है: प्रिस्क्रिप्शन डिजिटाइज़ करना, केयर प्लान बनाना, दवाओं व रीडिंग का ट्रैक और आपके रिकॉर्ड पर आधारित जवाब। खाता बनाकर आप ये शर्तें और गोपनीयता नीति स्वीकार करते हैं।',
      },
      {
        title: 'चिकित्सा सलाह नहीं',
        body: 'Curastra चिकित्सा उपकरण नहीं है, निदान नहीं करता, और डॉक्टर की जगह कभी नहीं लेता। AI उत्तर केवल जानकारी हैं, इनमें जानबूझकर सुरक्षा सीमाएँ हैं, और ये गलत हो सकते हैं — महत्वपूर्ण निर्णय हमेशा चिकित्सक से पुष्ट करें। आपात स्थिति में तुरंत आपातकालीन सेवाओं (भारत में 112) से संपर्क करें; ऐप पर निर्भर न रहें।',
      },
      {
        title: 'आपका खाता',
        body: 'आप जो अपलोड और पुष्टि करते हैं उसकी सटीकता आपकी ज़िम्मेदारी है — समीक्षा-और-पुष्टि चरण इसीलिए है। अपनी साख सुरक्षित रखें; 2FA सक्षम करने की पुरज़ोर सलाह है। आपकी बनाई पारिवारिक प्रोफ़ाइल आपकी ज़िम्मेदारी में हैं।',
      },
      {
        title: 'स्वीकार्य उपयोग',
        body: 'किसी की जानकारी उनकी जानकारी के बिना संग्रहीत न करें, सेवा को बाधित न करें, और कोई गैरकानूनी उपयोग न करें। आपके बनाए साझा लिंक आपकी ज़िम्मेदारी हैं — लिंक धारक समाप्ति या रद्द होने तक वह सारांश देख सकता है।',
      },
      {
        title: 'उपलब्धता',
        body: 'Curastra जैसा-है-वैसा उपलब्ध है, फ़िलहाल बिना औपचारिक SLA के। हम उपलब्धता और डेटा सुरक्षा के लिए काम करते हैं, पर रुकावटें और फ़ीचर बदलाव संभव हैं।',
      },
      {
        title: 'दायित्व',
        body: 'कानून द्वारा अनुमत अधिकतम सीमा तक, Curastra और उसके संचालक सेवा के उपयोग से — जिसमें AI सामग्री पर आधारित निर्णय शामिल हैं — होने वाली क्षति के लिए उत्तरदायी नहीं हैं।',
      },
      {
        title: 'संबंध समाप्त करना',
        body: 'आप कभी भी प्रोफ़ाइल से खाता हटा सकते हैं; हटाना तत्काल और स्थायी है। दुरुपयोग करने वाले खाते निलंबित हो सकते हैं। शर्तें बदल सकती हैं; ऊपर की तिथि वर्तमान संस्करण दर्शाती है।',
      },
      {
        title: 'संपर्क',
        body: 'इन शर्तों के बारे में प्रश्न: tianyulin819@gmail.com।',
      },
    ],
  },
}

export function PrivacyPage() {
  const { lang } = useLang()
  const c = PRIVACY[lang === 'hi' ? 'hi' : 'en']
  return <LegalShell title={c.title} updated={c.updated} sections={c.sections} />
}

export function TermsPage() {
  const { lang } = useLang()
  const c = TERMS[lang === 'hi' ? 'hi' : 'en']
  return <LegalShell title={c.title} updated={c.updated} sections={c.sections} />
}
