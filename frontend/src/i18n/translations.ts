// English / Hindi UI strings. JSON-key style: section.key.
// Hindi favors the natural register Indian health apps use: everyday words,
// common English loanwords (केयर प्लान, प्रिस्क्रिप्शन) where Hindi would sound stiff.

export type Lang = 'en' | 'hi'

type Entry = { en: string; hi: string }

export const T: Record<string, Entry> = {
  // ---- Shared nav / chrome ----
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.records': { en: 'Records', hi: 'रिकॉर्ड' },
  'nav.carePlans': { en: 'Care Plans', hi: 'केयर प्लान' },
  'nav.medications': { en: 'Medications', hi: 'दवाइयाँ' },
  'nav.vitals': { en: 'Vitals & Insights', hi: 'रीडिंग व सलाह' },
  'nav.assistant': { en: 'AI Assistant', hi: 'AI सहायक' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफ़ाइल' },
  'nav.signout': { en: 'Sign out', hi: 'साइन आउट' },
  'nav.signin': { en: 'Sign in', hi: 'साइन इन' },
  'nav.getStarted': { en: 'Get started', hi: 'शुरू करें' },
  'nav.openApp': { en: 'Open the app', hi: 'ऐप खोलें' },
  'chrome.caringFor': { en: 'Caring for', hi: 'देखभाल: किसके लिए' },
  'chrome.me': { en: 'Me', hi: 'मैं' },
  'chrome.child': { en: 'Child', hi: 'बच्चा' },
  'chrome.parent': { en: 'Parent', hi: 'माता-पिता' },
  'chrome.other': { en: 'Family member', hi: 'परिवार का सदस्य' },
  'chrome.viewingBanner': {
    en: "You are viewing {name}'s care ({rel}). Records, plans, and readings here are theirs.",
    hi: 'आप {name} की देखभाल देख रहे हैं ({rel})। यहाँ के रिकॉर्ड, प्लान और रीडिंग उन्हीं की हैं।',
  },
  'chrome.tagline': { en: 'Everyday care, continued', hi: 'रोज़मर्रा की देखभाल, निरंतर' },

  // ---- Landing ----
  'landing.badge': { en: 'AI-supported everyday care', hi: 'AI के सहारे रोज़मर्रा की देखभाल' },
  'landing.heroTitle1': { en: 'Care shouldn’t end', hi: 'देखभाल वहीं ख़त्म' },
  'landing.heroTitle2': { en: 'when the visit does.', hi: 'नहीं होनी चाहिए, जहाँ डॉक्टर की मुलाक़ात ख़त्म होती है।' },
  'landing.heroSub': {
    en: 'After the consultation comes the hard part: understanding the prescription, remembering the doses, knowing what’s normal. Curastra turns the paper you walk out with into a plan you can actually follow.',
    hi: 'डॉक्टर से मिलने के बाद असली मुश्किल शुरू होती है: प्रिस्क्रिप्शन समझना, दवा की खुराक याद रखना, यह जानना कि क्या सामान्य है। Curastra उस काग़ज़ को ऐसे प्लान में बदल देता है, जिस पर आप सच में चल सकें।',
  },
  'landing.try': { en: 'Try Curastra', hi: 'Curastra आज़माएँ' },
  'landing.how': { en: 'See how it works', hi: 'देखें, यह कैसे काम करता है' },
  'landing.trust': {
    en: 'Non-diagnostic by design. You confirm everything the AI reads.',
    hi: 'यह ऐप निदान नहीं करता। AI जो भी पढ़ता है, उसकी पुष्टि आप स्वयं करते हैं।',
  },
  'landing.handoverCaption': { en: 'The visit ends. Curastra carries it on.', hi: 'मुलाक़ात ख़त्म। आगे की देखभाल Curastra के साथ।' },
  'landing.problemEyebrow': { en: 'The problem', hi: 'समस्या' },
  'landing.problemTitle': { en: 'The moment care usually breaks down', hi: 'वह घड़ी, जब देखभाल अक्सर छूट जाती है' },
  'landing.p1Title': { en: 'Prescriptions live on paper', hi: 'प्रिस्क्रिप्शन काग़ज़ पर ही रह जाते हैं' },
  'landing.p1Text': {
    en: 'Photos get lost in the gallery, handwriting is hard to read, and "Tab Pan 40 OD AC" means nothing at the kitchen table.',
    hi: 'फ़ोटो गैलरी में खो जाती हैं, लिखावट पढ़ना मुश्किल है, और "Tab Pan 40 OD AC" का घर पर कोई मतलब नहीं निकलता।',
  },
  'landing.p2Title': { en: 'Instructions don’t stick', hi: 'हिदायतें याद नहीं रहतीं' },
  'landing.p2Text': {
    en: 'Doses get missed or doubled, follow-ups are forgotten, and warning signs go unrecognised until they become emergencies.',
    hi: 'खुराक छूट जाती है या दोहरी हो जाती है, फ़ॉलो-अप भूल जाते हैं, और चेतावनी के संकेत तब तक नज़र नहीं आते, जब तक बात बिगड़ न जाए।',
  },
  'landing.p3Title': { en: 'No one to ask at 9 pm', hi: 'रात 9 बजे पूछें तो किससे' },
  'landing.p3Text': {
    en: 'Small worries either get ignored or turn into anxious internet searches. Neither is care.',
    hi: 'छोटी चिंताएँ या तो अनदेखी रह जाती हैं या बेचैन इंटरनेट खोज बन जाती हैं। देखभाल दोनों में नहीं है।',
  },
  'landing.familyEyebrow': { en: 'For the whole family', hi: 'पूरे परिवार के लिए' },
  'landing.familyTitle': { en: 'One home for everyone’s care', hi: 'सबकी देखभाल का एक ठिकाना' },
  'landing.familySub': {
    en: 'Care rarely stops at yourself. Add the people who depend on you. Each keeps their own records, plans, medicines, and ABHA, and the whole app changes its colors to match who you are caring for.',
    hi: 'देखभाल सिर्फ़ अपनी नहीं होती। जो आप पर निर्भर हैं, उन्हें जोड़ें। हर सदस्य के अपने रिकॉर्ड, प्लान, दवाइयाँ और ABHA रहते हैं, और आप जिसकी देखभाल कर रहे हैं, ऐप का रंग-रूप उसी के अनुसार बदल जाता है।',
  },
  'landing.selfEyebrow': { en: 'For yourself', hi: 'अपने लिए' },
  'landing.selfTitle': { en: 'Your own recovery, made followable', hi: 'अपनी सेहत की राह, अब आसान' },
  'landing.selfStory': {
    en: 'You leave the clinic with a prescription and a headful of instructions. Scan it, confirm what was read, and live the days after with a plan instead of a guess.',
    hi: 'क्लिनिक से आप प्रिस्क्रिप्शन और ढेर सारी हिदायतें लेकर निकलते हैं। उसे स्कैन करें, पढ़े गए शब्दों की पुष्टि करें, और अंदाज़े की जगह एक साफ़ प्लान के साथ अगले दिन बिताएँ।',
  },
  'landing.selfB1': { en: 'Scan any prescription; you confirm every extracted word', hi: 'कोई भी प्रिस्क्रिप्शन स्कैन करें; हर शब्द की पुष्टि आप करते हैं' },
  'landing.selfB2': { en: 'Daily tasks you tick off, with progress you can see', hi: 'रोज़ के काम टिक करें, प्रगति आँखों के सामने' },
  'landing.selfB3': { en: 'An assistant that knows your medicines and readings', hi: 'एक सहायक, जो आपकी दवाइयाँ और रीडिंग जानता है' },
  'landing.selfCaption': { en: 'Recovery, with a plan in hand.', hi: 'हाथ में प्लान, राह आसान।' },
  'landing.childEyebrow': { en: 'For your children', hi: 'आपके बच्चों के लिए' },
  'landing.childTitle': { en: 'Small patients, zero guesswork', hi: 'नन्हे मरीज़, अंदाज़े की कोई जगह नहीं' },
  'landing.childStory': {
    en: 'A fever at midnight, a crumpled prescription from the paediatrician, and a dose you’d rather not get wrong. Your child’s own profile keeps their medicines separate from yours, explained in words tired parents can follow.',
    hi: 'आधी रात का बुख़ार, बाल रोग विशेषज्ञ का मुड़ा-तुड़ा प्रिस्क्रिप्शन, और वह खुराक जिसमें ग़लती नहीं होनी चाहिए। बच्चे की अपनी प्रोफ़ाइल उनकी दवाइयाँ आपसे अलग रखती है, और थके हुए माता-पिता को आसान शब्दों में समझाती है।',
  },
  'landing.childB1': { en: 'A separate profile with their own records and ABHA', hi: 'अलग प्रोफ़ाइल, अपने रिकॉर्ड और अपना ABHA' },
  'landing.childB2': { en: 'Doses and instructions rewritten in plain language', hi: 'खुराक और हिदायतें, सरल भाषा में' },
  'landing.childB3': { en: 'Safety checks tuned to exactly what they take', hi: 'सुरक्षा जाँच, ठीक उन्हीं दवाओं पर जो वे लेते हैं' },
  'landing.childCaption': { en: 'Small hands, held steady.', hi: 'नन्हे हाथ, मज़बूत साथ।' },
  'landing.parentEyebrow': { en: 'For your parents', hi: 'आपके माता-पिता के लिए' },
  'landing.parentTitle': { en: 'Their care, gently in view', hi: 'उनकी देखभाल, नज़रों के सामने' },
  'landing.parentStory': {
    en: 'Three medicines, two doctors, and a blood-pressure diary nobody keeps. Give your parents a profile of their own and watch the trends instead of worrying in the dark, with warnings that name the medicine rather than vague alarm.',
    hi: 'तीन दवाइयाँ, दो डॉक्टर, और ब्लड-प्रेशर की वह डायरी जो कोई नहीं रखता। माता-पिता को उनकी अपनी प्रोफ़ाइल दें और अँधेरे में चिंता करने की जगह रुझान देखें, ऐसी चेतावनियों के साथ जो दवा का नाम लेती हैं।',
  },
  'landing.parentB1': { en: 'Their prescriptions and follow-ups in one place', hi: 'उनके प्रिस्क्रिप्शन और फ़ॉलो-अप एक जगह' },
  'landing.parentB2': { en: 'Blood pressure and glucose trends you can actually see', hi: 'ब्लड प्रेशर और शुगर के रुझान, साफ़-साफ़' },
  'landing.parentB3': { en: 'Cross-medication safety checks across everything they take', hi: 'उनकी सभी दवाओं के बीच सुरक्षा जाँच' },
  'landing.parentCaption': { en: 'Walking beside them, gently.', hi: 'उनके साथ, हर क़दम पर।' },
  'landing.stepsEyebrow': { en: 'How it works', hi: 'यह कैसे काम करता है' },
  'landing.stepsTitle': { en: 'Three steps, and you approve each one', hi: 'तीन क़दम, और हर क़दम पर आपकी मंज़ूरी' },
  'landing.s1Title': { en: 'Upload', hi: 'अपलोड करें' },
  'landing.s1Text': { en: 'Snap or upload the prescription from your visit.', hi: 'अपनी मुलाक़ात का प्रिस्क्रिप्शन खींचें या अपलोड करें।' },
  'landing.s2Title': { en: 'Review & confirm', hi: 'जाँचें और पुष्टि करें' },
  'landing.s2Text': {
    en: 'Check the extracted text yourself. Nothing proceeds without your confirmation.',
    hi: 'निकाला गया टेक्स्ट स्वयं जाँचें। आपकी पुष्टि के बिना कुछ आगे नहीं बढ़ता।',
  },
  'landing.s3Title': { en: 'Live your plan', hi: 'अपने प्लान के साथ जिएँ' },
  'landing.s3Text': {
    en: 'A clear care plan, safety checks, and an assistant for the days after.',
    hi: 'साफ़ केयर प्लान, सुरक्षा जाँच, और आने वाले दिनों के लिए एक सहायक।',
  },
  'landing.safety': {
    en: 'Built to support, never to diagnose. Curastra never prescribes or changes a dose, shows a disclaimer with every AI result, and tells you clearly when something needs a real doctor.',
    hi: 'यह ऐप सहारा देने के लिए है, निदान के लिए नहीं। Curastra कभी दवा नहीं लिखता और न खुराक बदलता है, हर AI नतीजे के साथ अस्वीकरण दिखाता है, और साफ़ बताता है कि कब असली डॉक्टर की ज़रूरत है।',
  },
  'landing.includedTitle': { en: 'Everything included', hi: 'सब कुछ शामिल' },
  'landing.ctaTitle1': { en: 'Bring your last prescription.', hi: 'अपना पिछला प्रिस्क्रिप्शन लाइए।' },
  'landing.ctaTitle2': { en: 'See what it becomes.', hi: 'देखिए, वह क्या बन जाता है।' },
  'landing.ctaButton': { en: 'Get started for free', hi: 'मुफ़्त में शुरू करें' },
  'landing.footerNote': {
    en: 'An academic capstone project (BITS Pilani, Group 97). Not a medical device.',
    hi: 'एक शैक्षणिक कैपस्टोन प्रोजेक्ट (BITS पिलानी, ग्रुप 97)। यह चिकित्सा उपकरण नहीं है।',
  },
  'landing.f1Title': { en: 'Scan any prescription', hi: 'कोई भी प्रिस्क्रिप्शन स्कैन करें' },
  'landing.f1Text': { en: 'Photos, PDFs, or documents. The text is extracted for you in seconds.', hi: 'फ़ोटो, PDF या दस्तावेज़। टेक्स्ट सेकंडों में निकल आता है।' },
  'landing.f2Title': { en: 'You stay in control', hi: 'नियंत्रण आपके हाथ में' },
  'landing.f2Text': { en: 'You read, correct, and confirm every extracted word before any AI uses it.', hi: 'AI के इस्तेमाल से पहले हर शब्द आप पढ़ते, सुधारते और पुष्टि करते हैं।' },
  'landing.f3Title': { en: 'Clear after-care plans', hi: 'साफ़ केयर प्लान' },
  'landing.f3Text': { en: 'Medications, daily tasks, and warning signs in a plan that stays traceable to your prescription.', hi: 'दवाइयाँ, रोज़ के काम और चेतावनियाँ, ऐसे प्लान में जो आपके प्रिस्क्रिप्शन से जुड़ा रहता है।' },
  'landing.f4Title': { en: 'Medication safety checks', hi: 'दवा सुरक्षा जाँच' },
  'landing.f4Text': { en: 'Duplicates and risky interactions across everything you take, flagged early.', hi: 'दोहरी दवाएँ और जोखिम भरे मेल, समय रहते पकड़े जाते हैं।' },
  'landing.f5Title': { en: 'Vitals & gentle insights', hi: 'रीडिंग और सौम्य सलाह' },
  'landing.f5Text': { en: 'Log blood pressure, glucose, or weight and see what your readings are saying.', hi: 'ब्लड प्रेशर, शुगर या वज़न दर्ज करें और देखें कि आपकी रीडिंग क्या कह रही हैं।' },
  'landing.f6Title': { en: 'An assistant that knows you', hi: 'एक सहायक, जो आपको जानता है' },
  'landing.f6Text': { en: 'Ask anything about your medicines, plan, or readings. Real emergencies are escalated to a doctor.', hi: 'दवाओं, प्लान या रीडिंग के बारे में कुछ भी पूछें। असली आपात स्थिति में डॉक्टर के पास भेजा जाता है।' },

  // ---- Dashboard ----
  'dash.hello': { en: 'Hello, {name}', hi: 'नमस्ते, {name}' },
  'dash.sub': { en: 'Here is where your care stands today.', hi: 'आज आपकी देखभाल की स्थिति यह है।' },
  'dash.records': { en: 'Records', hi: 'रिकॉर्ड' },
  'dash.plans': { en: 'Care plans', hi: 'केयर प्लान' },
  'dash.activeMeds': { en: 'Active medications', hi: 'चल रही दवाइयाँ' },
  'dash.lastReading': { en: 'Last reading', hi: 'पिछली रीडिंग' },
  'dash.uploadTitle': { en: 'Upload a prescription', hi: 'प्रिस्क्रिप्शन अपलोड करें' },
  'dash.uploadText': { en: 'Scan it, review the text, and turn it into a clear care plan.', hi: 'स्कैन करें, टेक्स्ट जाँचें, और साफ़ केयर प्लान बनाएँ।' },
  'dash.askTitle': { en: 'Ask the AI assistant', hi: 'AI सहायक से पूछें' },
  'dash.askText': { en: 'Questions about your medicines, plan, or readings, answered in context.', hi: 'दवाओं, प्लान या रीडिंग के सवाल, आपके संदर्भ में जवाब।' },
  'dash.warnTitle': { en: 'Warning signs from your latest care plan', hi: 'आपके ताज़ा केयर प्लान की चेतावनियाँ' },
  'dash.openPlan': { en: 'Open the plan', hi: 'प्लान खोलें' },
  'dash.checkTitle': { en: 'Getting started', hi: 'शुरुआत करें' },
  'dash.checkSub': { en: 'Three small steps and Curastra starts working for you.', hi: 'तीन छोटे क़दम, और Curastra आपके लिए काम करने लगेगा।' },
  'dash.check1': { en: 'Add your health basics', hi: 'अपनी सेहत की बुनियादी जानकारी जोड़ें' },
  'dash.check2': { en: 'Upload a prescription', hi: 'प्रिस्क्रिप्शन अपलोड करें' },
  'dash.check3': { en: 'Generate your first care plan', hi: 'पहला केयर प्लान बनाएँ' },
  'dash.check4': { en: 'Ask the assistant anything', hi: 'सहायक से कुछ भी पूछें' },
  'dash.footer': {
    en: 'Curastra supports your everyday care. It never diagnoses or replaces medical advice.',
    hi: 'Curastra आपकी रोज़मर्रा की देखभाल में सहारा है। यह न निदान करता है, न डॉक्टर की सलाह की जगह लेता है।',
  },

  // ---- Auth ----
  'auth.welcomeBack': { en: 'Welcome back', hi: 'फिर से स्वागत है' },
  'auth.signinSub': { en: 'Sign in to continue your care.', hi: 'अपनी देखभाल जारी रखने के लिए साइन इन करें।' },
  'auth.email': { en: 'Email', hi: 'ईमेल' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.signinBtn': { en: 'Sign in', hi: 'साइन इन करें' },
  'auth.newHere': { en: 'New here?', hi: 'पहली बार आए हैं?' },
  'auth.createAccount': { en: 'Create an account', hi: 'खाता बनाएँ' },

  // ---- Page titles ----
  'records.title': { en: 'Health Records', hi: 'स्वास्थ्य रिकॉर्ड' },
  'records.sub': { en: 'Upload prescriptions and lab reports as photos, PDFs, or documents.', hi: 'प्रिस्क्रिप्शन और लैब रिपोर्ट फ़ोटो, PDF या दस्तावेज़ के रूप में अपलोड करें।' },
  'plans.title': { en: 'Care Plans', hi: 'केयर प्लान' },
  'plans.sub': { en: 'Structured after-care plans generated from your confirmed prescriptions.', hi: 'आपके पुष्टि किए गए प्रिस्क्रिप्शन से बने व्यवस्थित केयर प्लान।' },
  'meds.title': { en: 'Medications', hi: 'दवाइयाँ' },
  'meds.sub': { en: 'Your current medicines. Run a safety check for duplicates and interactions.', hi: 'आपकी मौजूदा दवाइयाँ। दोहराव और मेल की सुरक्षा जाँच चलाएँ।' },
  'vitals.title': { en: 'Vitals & Insights', hi: 'रीडिंग व सलाह' },
  'vitals.sub': { en: 'Log your readings and get gentle, factual insights.', hi: 'अपनी रीडिंग दर्ज करें और सौम्य, तथ्यों पर टिकी सलाह पाएँ।' },
  'chat.title': { en: 'AI Health Assistant', hi: 'AI स्वास्थ्य सहायक' },
  'chat.sub': { en: 'Ask about your medications, plan, or readings.', hi: 'अपनी दवाओं, प्लान या रीडिंग के बारे में पूछें।' },
  'chat.empty': { en: 'Ask me anything about your care', hi: 'अपनी देखभाल के बारे में कुछ भी पूछें' },
  'chat.chip1': { en: 'When should I take my medicines?', hi: 'मुझे अपनी दवाइयाँ कब लेनी चाहिए?' },
  'chat.chip2': { en: 'What does my care plan say?', hi: 'मेरा केयर प्लान क्या कहता है?' },
  'chat.chip3': { en: 'What do my recent readings look like?', hi: 'मेरी हाल की रीडिंग कैसी हैं?' },
  'chat.chip4': { en: 'What should I watch out for?', hi: 'मुझे किन बातों का ध्यान रखना चाहिए?' },
  'chat.placeholder': { en: 'Type your question…', hi: 'अपना सवाल लिखें…' },
  'chat.disclaimer': {
    en: 'The assistant gives general guidance only. It does not diagnose or replace your doctor.',
    hi: 'सहायक केवल सामान्य मार्गदर्शन देता है। यह निदान नहीं करता और डॉक्टर की जगह नहीं लेता।',
  },
  'chat.seekHelp': { en: 'Please seek medical help. Contact a doctor or emergency services.', hi: 'कृपया चिकित्सा सहायता लें। डॉक्टर या आपातकालीन सेवा से संपर्क करें।' },
  'profile.title': { en: 'Profile', hi: 'प्रोफ़ाइल' },
  'profile.sub': { en: 'Your account, health basics, reminders, and health ID.', hi: 'आपका खाता, सेहत की जानकारी, रिमाइंडर और हेल्थ ID।' },
}

export function translate(key: string, lang: Lang, vars?: Record<string, string>): string {
  const entry = T[key]
  let text = entry ? entry[lang] : key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v)
  }
  return text
}
