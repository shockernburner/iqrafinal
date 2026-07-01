export type IqraResponse = {
  directAnswer: string;
  framework: string[];
  source: string;
  sourceLinks?: Array<{ label: string; href: string }>;
  requiresScholarReferral?: boolean;
  clarifyingQuestion?: string | null;
  confidence?: "high" | "medium" | "low";
};

import { CANONICAL_BASMALA } from "@/lib/iqra-policy";

const responses: Array<{ match: RegExp; response: IqraResponse }> = [
  {
    match: /shura|consult|consultation|complex problem|solve complex/i,
    response: {
      directAnswer:
        "A leader should use Shura by bringing the right people into the room, listening carefully before deciding, and then taking responsibility for a clear, fair course of action. Consultation is not a delay tactic; it is a disciplined way to reduce ego, surface hidden risks, and earn trust before execution.",
      framework: [
        "Invite relevant counsel: include people with knowledge, responsibility, and integrity",
        "Clarify the decision: separate facts, risks, trade-offs, and Shariah concerns before choosing",
        "Act with accountability: once the decision is made, execute fairly and review outcomes",
      ],
      source: "Shura is treated as a leadership duty and decision discipline in the IQRA knowledge base.",
    },
  },
  {
    match: /social responsibility|csr|community initiative/i,
    response: {
      directAnswer:
        "A business should treat social responsibility as part of Amanah, not as public relations. Start with duties that are closest to the company: fair wages, honest products, lawful sourcing, environmental care, and support for the local community without waste or showing off.",
      framework: [
        "Begin with obligations: fix unfairness inside the business before marketing charity outside it",
        "Choose real benefit: support initiatives that protect dignity, livelihood, education, or welfare",
        "Keep intention clean: measure impact without turning service into vanity or manipulation",
      ],
      source: "IQRA knowledge guidance on Amanah, Ihsan, and ethical business responsibility.",
    },
  },
  {
    match: /amanah|trust|organizational operation|operations/i,
    response: {
      directAnswer:
        "Amanah means the organization treats every responsibility as a trust: money, people, promises, data, time, and authority must be handled honestly. In practice, it turns operations into accountable systems: clear roles, transparent records, fair treatment, and decisions that can be explained without hiding anything.",
      framework: [
        "Trust in assets: protect company, customer, and investor resources from misuse",
        "Trust in people: pay fairly, communicate honestly, and avoid exploiting staff or clients",
        "Trust in decisions: document commitments, disclose conflicts, and keep promises measurable",
      ],
      source: "Amanah is used across the IQRA knowledge base as the ethical foundation for business responsibility.",
    },
  },
  {
    match: /transparen|communication|communicate|team communication/i,
    response: {
      directAnswer:
        "A leader fosters transparency by making important information visible early, explaining the reason behind decisions, and creating a culture where people can raise concerns without fear. Transparency does not mean exposing every private detail; it means giving the team enough truth to act responsibly and trust the process.",
      framework: [
        "Share the why: explain goals, constraints, and decision criteria before confusion grows",
        "Create feedback channels: let team members question risks and report issues safely",
        "Document commitments: keep decisions, ownership, and follow-up visible to everyone affected",
      ],
      source: "IQRA guidance connects transparency with Amanah, truthful communication, and accountable leadership.",
    },
  },
  {
    match: /haqq|right|rights|professional dealing/i,
    response: {
      directAnswer:
        "Haqq in professional dealings means giving every person and obligation its due right. For a business, that means contracts are honored, workers are paid properly, customers are not misled, partners receive what was agreed, and power is not used to take more than one is entitled to.",
      framework: [
        "Honor rights: deliver what was promised in quality, time, price, and scope",
        "Prevent harm: do not hide defects, manipulate information, or pressure weaker parties",
        "Resolve fairly: when conflict appears, return to evidence, agreement, and justice",
      ],
      source: "The IQRA knowledge base connects Haqq with justice, contract integrity, and daily business ethics.",
    },
  },
  {
    match: /performance management|team performance|employee performance|kpi|review/i,
    response: {
      directAnswer:
        "Islamic performance management should be fair, truthful, and developmental. The company can set clear standards and hold people accountable, but it must avoid humiliation, favoritism, hidden criteria, or pressure that pushes employees toward dishonesty or burnout.",
      framework: [
        "Set clear expectations: define duties, metrics, and review periods before judging people",
        "Assess with justice: use evidence, context, and consistent standards across the team",
        "Develop people: pair accountability with coaching, support, and a path to improve",
      ],
      source: "IQRA knowledge guidance on justice, Amanah, and responsible management.",
    },
  },
  {
    match: /employee engagement|well-being|wellbeing|mental health|staff welfare/i,
    response: {
      directAnswer:
        "A company should manage employee engagement and well-being as a trust. People are not just output units; they have dignity, families, limits, and rights. Build a workplace where expectations are clear, workloads are humane, concerns can be raised safely, and good work is recognized fairly.",
      framework: [
        "Protect dignity: avoid fear-based management, public shaming, and exploitative workloads",
        "Listen early: use regular check-ins to catch stress, confusion, and unfair treatment",
        "Support balance: align targets with humane capacity, lawful conduct, and family responsibility",
      ],
      source: "IQRA knowledge guidance on Amanah, Rahmah, and ethical leadership.",
    },
  },
  {
    match: /investor|shareholder relation|shareholders/i,
    response: {
      directAnswer:
        "Investor and shareholder relations should be built on transparency, Amanah, and fair disclosure. Management must communicate material risks honestly, avoid inflated promises, protect minority rights, and use entrusted capital only for the purposes agreed.",
      framework: [
        "Disclose honestly: report performance, risk, and constraints without selective spin",
        "Protect rights: respect agreed governance, voting, profit, and information rights",
        "Avoid manipulation: do not use hype, concealment, or insider advantage to shift losses unfairly",
      ],
      source: "IQRA knowledge guidance on corporate governance and Islamic business ethics.",
    },
  },
  {
    match: /hikmah|wisdom in management/i,
    response: {
      directAnswer:
        "Hikmah in management is the ability to place the right action in the right way at the right time. It combines principle with judgment: a leader stays faithful to ethics while considering context, consequences, people, and timing.",
      framework: [
        "Understand context: do not apply rules mechanically without knowing the facts",
        "Balance interests: protect rights while choosing the least harmful workable path",
        "Act with maturity: use firmness, patience, or mercy according to what justice requires",
      ],
      source: "IQRA knowledge guidance on wisdom, leadership, and principled decision-making.",
    },
  },
  {
    match: /historical wisdom|modern business problems|history/i,
    response: {
      directAnswer:
        "A leader can apply historical wisdom by extracting principles, not copying old forms blindly. Look at how earlier Muslim leaders handled trust, consultation, justice, market fairness, and public welfare, then translate those principles into today’s operating model.",
      framework: [
        "Extract principles: identify the ethical rule behind the historical example",
        "Translate carefully: adapt the method to current law, markets, technology, and people",
        "Test outcomes: check whether the decision preserves justice, trust, and real benefit",
      ],
      source: "IQRA knowledge guidance on Seerah, governance, and Islamic business ethics.",
    },
  },
  {
    match: /algorithmic|automated decision|ai decision|machine learning/i,
    response: {
      directAnswer:
        "Algorithmic decision-making becomes ethically risky when it hides bias, shifts blame to software, or affects people’s rights without explanation. A Muslim-led company should keep human accountability, audit the data, and give affected people a fair way to challenge outcomes.",
      framework: [
        "Audit bias: check whether data or model outputs harm groups unfairly",
        "Keep accountability: a responsible human must own decisions, not hide behind automation",
        "Allow appeal: users and employees need a clear route to question serious decisions",
      ],
      source: "IQRA knowledge guidance on justice, harm prevention, and responsible governance.",
    },
  },
  {
    match: /product design|product development|ethical product/i,
    response: {
      directAnswer:
        "Ethical product design begins by asking whether the product creates lawful benefit without manipulating, addicting, exploiting, or deceiving users. The roadmap should prioritize real user welfare, privacy, accessibility, and truthful claims over short-term growth tricks.",
      framework: [
        "Define lawful benefit: be clear about the real problem the product solves",
        "Remove manipulation: avoid dark patterns, addiction loops, and misleading defaults",
        "Protect users: design for privacy, clarity, accessibility, and informed consent",
      ],
      source: "IQRA knowledge guidance on Maqasid, harm prevention, and business ethics.",
    },
  },
  {
    match: /istiqamah|consistency|professional decision/i,
    response: {
      directAnswer:
        "Istiqamah in professional decision-making means staying consistently upright even when pressure, profit, or fear makes compromise attractive. It turns ethics into a repeatable operating habit rather than an occasional statement.",
      framework: [
        "Set non-negotiables: define what the company will not do even for profit",
        "Use consistent standards: apply rules the same way across clients, staff, and leaders",
        "Review drift: regularly check where small compromises are becoming culture",
      ],
      source: "IQRA knowledge guidance on steadfastness, Amanah, and ethical governance.",
    },
  },
  {
    match: /ethical growth|growth within a company|company culture/i,
    response: {
      directAnswer:
        "A leader fosters ethical growth by making good conduct easier to practice than misconduct. That means hiring for character, rewarding truthful behavior, correcting harm early, and designing systems where people can succeed without cutting corners.",
      framework: [
        "Model the standard: leaders must visibly follow the rules they expect from others",
        "Reward integrity: promotion and bonuses should not favor harmful shortcuts",
        "Correct early: address small ethical breaches before they become operating culture",
      ],
      source: "IQRA knowledge guidance on Tazkiyah, Amanah, and leadership responsibility.",
    },
  },
  {
    match: /asset management|business asset|company assets/i,
    response: {
      directAnswer:
        "Business assets are an Amanah. They should be acquired lawfully, used for legitimate company purposes, protected from waste, recorded accurately, and not mixed with personal benefit unless explicitly authorized.",
      framework: [
        "Protect entrusted property: prevent misuse, neglect, theft, and avoidable waste",
        "Record accurately: keep clean books, ownership records, and approval trails",
        "Use lawfully: ensure assets serve permissible work and agreed business purposes",
      ],
      source: "IQRA knowledge guidance on Amanah, accounting ethics, and business stewardship.",
    },
  },
  {
    match: /user data|data management|data usage|privacy/i,
    response: {
      directAnswer:
        "User data should be treated as a trust, not as raw material to exploit. Collect only what is needed, explain how it will be used, protect it carefully, and do not sell, expose, or manipulate users through information they entrusted to the company.",
      framework: [
        "Collect minimally: take only the data needed for a lawful, clear purpose",
        "Use transparently: explain consent, retention, sharing, and user control in plain language",
        "Protect strongly: secure the data and respond honestly if harm or breach occurs",
      ],
      source: "IQRA knowledge guidance on Amanah, privacy, and harm prevention.",
    },
  },
  {
    match: /ikhlas|sincerity|team culture/i,
    response: {
      directAnswer:
        "A leader cultivates Ikhlas by shifting the culture away from ego, politics, and appearance, and toward sincere service, honest work, and accountability before Allah. In a company, this means people are valued for real contribution and integrity, not just visibility.",
      framework: [
        "Clarify intention: connect work to service, lawful value, and responsibility",
        "Reduce ego incentives: avoid systems that reward self-promotion over substance",
        "Keep private accountability: encourage quiet excellence, honesty, and self-review",
      ],
      source: "IQRA knowledge guidance on Ikhlas, Tazkiyah, and leadership character.",
    },
  },
  {
    match: /ethical conflict|conflicting ethics|complex ethical/i,
    response: {
      directAnswer:
        "When a business faces a complex ethical conflict, slow the decision down and separate rights, harms, obligations, and alternatives. The better option is not always the easiest one; it is the one that best preserves justice, trust, lawful benefit, and accountability.",
      framework: [
        "Map stakeholders: identify who may gain, lose, be harmed, or have rights involved",
        "Rank obligations: distinguish fixed duties from preferences and commercial pressure",
        "Choose transparently: document the reasoning and seek qualified advice where needed",
      ],
      source: "IQRA knowledge guidance on Maqasid, harm prevention, and ethical decision-making.",
    },
  },
  {
    match: /tawakkul|organizational leadership|rely on allah/i,
    response: {
      directAnswer:
        "Tawakkul in organizational leadership means taking the right means seriously while knowing outcomes belong to Allah. It is not passivity; it is disciplined planning, ethical execution, sincere du’a, and calm acceptance after doing what is responsibly possible.",
      framework: [
        "Use the means: plan, consult, measure risk, and execute competently",
        "Keep ethics under pressure: do not justify haram shortcuts because results feel uncertain",
        "Accept outcomes: learn, adapt, and remain steady after sincere effort",
      ],
      source: "IQRA knowledge guidance on Tawakkul, leadership, and responsible action.",
    },
  },
  {
    match: /local community|community development|contribute to community/i,
    response: {
      directAnswer:
        "A company can contribute to local community development by creating lawful jobs, paying fairly, supporting useful local services, sourcing responsibly, and addressing real community needs. The goal is sustainable benefit, not one-time publicity.",
      framework: [
        "Start nearby: understand the needs of workers, customers, suppliers, and neighbors",
        "Build capacity: support skills, education, fair opportunity, and local enterprise",
        "Measure benefit: track real outcomes and avoid waste, dependency, or performative charity",
      ],
      source: "IQRA knowledge guidance on public benefit, justice, and ethical commerce.",
    },
  },
  {
    match: /modern trade|commerce|trade and commerce/i,
    response: {
      directAnswer:
        "Islam views trade and commerce as honorable when they create lawful value through honesty, consent, fair exchange, and real benefit. Modern tools may change the form of business, but the core duties remain: no riba, deception, exploitation, gambling-like risk, or unjust harm.",
      framework: [
        "Create lawful value: sell real benefit through clear ownership, consent, and delivery",
        "Keep terms clean: remove interest, fraud, hidden defects, and excessive uncertainty",
        "Serve society: let growth support fairness, trust, and useful prosperity",
      ],
      source: "IQRA knowledge guidance on Islamic commercial ethics and lawful trade.",
    },
  },
  {
    match: /poultry|chicken|farm|farming|livestock|animal|meat|slaughter|halal business/i,
    response: {
      directAnswer:
        "Start the poultry business in a halal way by making the product lawful, the animal treatment merciful, the slaughter process Shariah-compliant, and the commercial records transparent from day one.",
      framework: [
        "Halal supply chain: feed, medication, slaughter, and handling must remain lawful and traceable",
        "Rahmah: birds must be housed, transported, and processed without cruelty or avoidable harm",
        "Amanah: pricing, weights, payroll, contracts, and customer claims must be honest and documented",
      ],
      source:
        "Allah has prescribed excellence in all things; when you slaughter, slaughter well. — Sahih Muslim",
    },
  },
  {
    match: /zakat|zakah|nisab/i,
    response: {
      directAnswer:
        "Zakat is due at 2.5% on qualifying wealth that has completed one lunar year and exceeds the nisab threshold.",
      framework: [
        "Hawl: qualifying wealth completes one lunar year",
        "Nisab: net zakatable wealth exceeds the threshold",
        "Tathir: zakat purifies wealth and moves benefit to eligible recipients",
      ],
      source: "Take from their wealth a charity by which you purify them. — Qur'an, Surah At-Tawbah 9:103",
    },
  },
  {
    match: /crypto|bitcoin|token|coin/i,
    response: {
      directAnswer:
        "A cryptoasset requires screening for lawful utility, ownership clarity, excessive uncertainty, and speculation before it can be treated as permissible.",
      framework: [
        "Maliyyah: the asset must have recognised lawful value",
        "Gharar: excessive uncertainty must be controlled",
        "Maysir: gambling-style exposure must be absent",
      ],
      source: "Allah has permitted trade and forbidden interest. — Qur'an, Surah Al-Baqarah 2:275",
    },
  },
  {
    match: /interest|riba|loan|mortgage|financ/i,
    response: {
      directAnswer:
        "Interest-bearing structures are not permissible; redirect toward a sale, lease, or partnership model where risk and return are genuinely shared.",
      framework: [
        "Riba: guaranteed increase on a loan is prohibited",
        "Amanah: the contract must preserve fiduciary trust",
        "Musharakah: partnership returns must track real commercial exposure",
      ],
      source: "Allah has permitted trade and forbidden interest. — Qur'an, Surah Al-Baqarah 2:275",
    },
  },
  {
    match: /contract|deal|agreement|equity|partner|investment|revenue/i,
    response: {
      directAnswer:
        "A commercial structure is viable when capital, duties, risk, and profit ratios are explicit; it fails when capital protection or fixed return language disguises interest.",
      framework: [
        "Amanah: fiduciary trust between parties",
        "Gharar: ambiguity must be removed from terms",
        "Ihsan: execution must remain fair and operationally excellent",
      ],
      source: "O you who believe, fulfil your contracts. — Qur'an, Surah Al-Ma'idah 5:1",
    },
  },
  {
    match: /leader|team|stress|pressure|crisis|manage|burnout|panic/i,
    response: {
      directAnswer:
        "While this challenge introduces clear complexity, recall that sustenance (Rizq) is structurally guaranteed and adversity serves as institutional redirection; proceed with consultation, patience, and just execution.",
      framework: [
        "Shura: consult before committing to direction",
        "Sabr: maintain disciplined patience under pressure",
        "Tawakkul: rely on Allah after exhausting lawful means",
      ],
      source: "And consult them in the matter. — Qur'an, Surah Aal-e-Imran 3:159",
    },
  },
];

const fallback: IqraResponse = {
  directAnswer:
    "A good first step is to slow the question down and identify what is being promised, who carries the risk, who may be harmed, and whether the terms are honest and lawful. From there, choose the path that protects trust, removes deception, and keeps the benefit real rather than cosmetic.",
  framework: [
    "Clarify the facts: identify the parties, money flow, duties, and risk",
    "Screen the harms: remove interest, deception, exploitation, and excessive ambiguity",
    "Choose the cleaner path: document terms and ask a qualified scholar for formal Fatwa-level cases",
  ],
  source: "IQRA system guidance and the local knowledge base were used for this general answer.",
  confidence: "low",
};

export function buildIqraResponse(prompt: string): IqraResponse {
  const matched = responses.find((item) => item.match.test(prompt));
  if (!matched) return fallback;
  return {
    ...matched.response,
    confidence: matched.response.confidence ?? "medium",
  };
}

export function formatBasmala() {
  return CANONICAL_BASMALA;
}