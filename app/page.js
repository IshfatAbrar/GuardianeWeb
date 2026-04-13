import Image from "next/image";
import Link from "next/link";
import { PartnerWithUsModal } from "../components/partner-with-us-modal";
import { contactEmail } from "../lib/siteConfig";

const teamMembers = [
  {
    name: "Dr. Tingting Zhang",
    role: "Founding Director",
    affiliation: "University of South Florida",
    bio: "Scholar in technology innovation, artificial intelligence, and human-centered innovation. Her work focuses on developing ethical, practical, and socially impactful AI systems to protect children and families, strengthen digital safety, and expand access to mental health and community support.",
  },
  {
    name: "Dr. Jing Wang",
    role: "Research Member",
    affiliation: "University of South Florida",
    bio: "Professor of Instruction and Director of the Pathway to Computing Program. Her work focuses on computing education, computer animation, and broadening participation in computing, bringing expertise in inclusive technology education and student-centered innovation.",
  },
  {
    name: "Dr. Seungbae Kim",
    role: "Research Member",
    affiliation: "University of South Florida",
    bio: "Assistant Professor in the Bellini College of Artificial Intelligence, Cybersecurity and Computing. Research centers on AI, social AI, and trustworthy machine learning systems for complex real-world decision-making.",
  },
  {
    name: "Dr. Yongjei Lee",
    role: "Research Member",
    affiliation: "University of South Florida",
    bio: "Assistant Professor in Criminology. Expertise includes spatial-temporal crime analysis and predictive approaches to public safety, contributing insight into risk patterns, intervention strategies, and data-informed protection systems.",
  },
  {
    name: "Dr. Guangjing Wang",
    role: "Research Member",
    affiliation: "University of South Florida",
    bio: "Assistant Professor in the Bellini College of AI, Cybersecurity and Computing. Research focuses on LLM agents, security and privacy, sensing, and intelligent data systems—advancing privacy-aware technologies and secure computing.",
  },
  {
    name: "Dr. Xiaomin Lin",
    role: "Research Member",
    affiliation: "University of South Florida",
    bio: "Assistant Professor in Electrical Engineering with affiliated work spanning robotics and AI. Research sits at the intersection of perception, autonomy, edge AI, and intelligent robotic systems across healthcare and other domains.",
  },
  {
    name: "Dr. Wenbin Zhang",
    role: "Research Member",
    affiliation: "Florida International University",
    bio: "Assistant Professor in the Knight Foundation School of Computing and Information Sciences at FIU. Research focuses on responsible AI and socially beneficial machine learning, with applications in healthcare, digital forensics, and beyond.",
  },
  {
    name: "Dr. Stacie Herrera",
    role: "Clinical Advisor",
    affiliation: "Herrera Psychology",
    bio: "Licensed school psychologist and owner of Herrera Psychology. Expert in supporting children and adolescents through psychological assessment, therapy, and school-based guidance with expertise in learning, coping, and family-centered mental health.",
  },
  {
    name: "Dr. Heather Agazzi",
    role: "Clinical Advisor",
    affiliation: "USF Health",
    bio: "Professor at USF Health in Pediatrics with a joint appointment in Psychiatry and Behavioral Neurosciences, and Chief of the Division of Child Development. Board-certified specialist in Clinical Child and Adolescent Psychology.",
  },
];

const whyItems = [
  {
    label: "Real-time support",
    body: "Early awareness of potential digital safety and emotional risks",
  },
  {
    label: "Parent-centered guidance",
    body: "Practical tools tailored to individual family needs",
  },
  {
    label: "Educational empowerment",
    body: "Digital safety, resilience, and life-skills learning resources",
  },
  {
    label: "Mental wellness support",
    body: "Seamless pathways to trusted counselor networks",
  },
  {
    label: "Privacy-conscious design",
    body: "Responsible AI development built on family trust",
  },
  {
    label: "Integrated ecosystem",
    body: "Technology, education, and care unified in one platform",
  },
];

const whatWeDo = [
  "Detect digital safety and emotional risk signals in real time",
  "Support parents with practical, personalized guidance",
  "Provide children and teens with developmentally appropriate learning resources",
  "Connect families with trusted counseling and crisis support when needed",
  "Prioritize privacy-preserving, responsible AI design",
];

const guardianeFeatures = [
  {
    title: "Intelligent Monitoring",
    desc: "Real-time detection of digital safety and emotional risk signals",
  },
  {
    title: "Dynamic Education",
    desc: "Developmentally appropriate content for children and teens",
  },
  {
    title: "Parental Guidance",
    desc: "Personalized, practical tools tailored to every family",
  },
  {
    title: "Counselor Networks",
    desc: "Seamless access to vetted mental health professionals",
  },
];

const careerAreas = [
  "AI and machine learning",
  "Fair and trustworthy AI",
  "Digital safety research",
  "Child and adolescent wellbeing",
  "Educational content development",
  "Family engagement and community outreach",
  "Counseling partnerships and care coordination",
  "Product design and user experience",
];

export default function Home() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip text-[var(--foreground)]">
        {/* ── HERO ── */}
        <section className="clarity-hero border-b border-[var(--border)]">
          <div className="clarity-wrap grid gap-14 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:px-8 lg:pb-28">
            <div className="clarity-copy">
              <h1 className="gradient-heading max-w-3xl text-[2.75rem] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[3.2rem] lg:text-[3.55rem]">
                AI-Guardian Center
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-9 text-[var(--foreground)]">
                Protecting children&apos;s digital safety and mental wellbeing
                through responsible AI
              </p>
              <p className="clarity-prose mt-6 max-w-2xl">
                The AI-Guardian Center is dedicated to developing innovative,
                ethical, and privacy-conscious AI solutions that protect
                children and teens in digital environments. Through advanced
                risk detection, parent-centered support tools, educational
                resources, and counselor-connected care pathways, the Center
                works to create safer online experiences and stronger mental
                wellbeing support systems for families and communities.
              </p>
              <p className="mt-5 max-w-2xl text-sm italic leading-8 text-[var(--muted)]">
                &ldquo;Every child is unique and blessed. At AI-Guardian Center,
                we devote our utmost efforts to ensuring children&apos;s digital
                safety and mental wellbeing.&rdquo;
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#about"
                  className="focus-visible-ring outline-btn rounded-sm px-6 py-2.5 text-[0.78rem] font-medium uppercase tracking-[0.12em]"
                >
                  Learn More
                </a>
                <Link
                  href="/guardiane"
                  className="focus-visible-ring outline-btn rounded-sm px-6 py-2.5 text-[0.78rem] font-medium uppercase tracking-[0.12em]"
                >
                  Explore Guardiané
                </Link>
                <PartnerWithUsModal
                  email={contactEmail}
                  className="focus-visible-ring outline-btn rounded-sm px-6 py-2.5 text-[0.78rem] font-medium uppercase tracking-[0.12em]"
                >
                  Partner With Us
                </PartnerWithUsModal>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="mx-auto flex w-full max-w-[320px] items-center justify-center">
                <Image
                  src="/logo.gif"
                  alt="AI-Guardian Center logo"
                  width={260}
                  height={260}
                  priority
                  unoptimized
                  className="opacity-95"
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT THE CENTER ── */}
        <section
          id="about"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title mb-14">
              <h2 className="gradient-heading text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                Who We Are
              </h2>
            </div>

            <div data-reveal className="clarity-article">
              <p>
                The AI-Guardian Center is an innovation and research hub focused
                on advancing artificial intelligence solutions for child and
                adolescent digital safety, emotional wellbeing, and family
                support. We bring together expertise in AI, education, mental
                health, family wellbeing, and responsible technology design to
                develop tools that are effective, ethical, and accessible.
              </p>

              <h3>Our Vision</h3>
              <p className="text-[var(--foreground)]">
                To build a future where every child can grow, learn, and
                interact online in a safe, supportive, and empowering digital
                environment.
              </p>

              <h3>Our Mission</h3>
              <p>
                The AI-Guardian Center delivers real-time safety intelligence,
                personalized parental guidance, and seamless access to vetted
                mental health counselor networks, removing barriers to
                protecting children&apos;s digital and emotional wellbeing.
              </p>

              <h3>What We Do</h3>
              <ul className="space-y-2">
                {whatWeDo.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── FLAGSHIP: GUARDIANÉ ── */}
        <section
          id="guardiane"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title mb-14">
              <h2 className="gradient-heading text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                Guardiané
              </h2>
            </div>

            <div data-reveal className="clarity-article">
              <p>
                Guardiané is a mobile-based system for real-time risk detection
                and parental support that operates with a strong focus on
                privacy and child wellbeing. The platform integrates intelligent
                monitoring, dynamic educational content, and interactive support
                tools to help families navigate digital safety and mental
                wellness challenges.
              </p>

              <blockquote className="mt-6 border-l-2 border-[var(--accent)] pl-5 text-sm italic text-[var(--muted)]">
                &ldquo;Every child is unique and blessed. At Guardiané, we
                devote our utmost efforts to ensuring your child&apos;s digital
                safety and mental wellbeing.&rdquo;
              </blockquote>

              <h3>Marketing Summary</h3>
              <p className="text-[var(--foreground)]">
                Guardiané combines real-time safety and vetted counselor support
                to protect children&apos;s digital and mental wellbeing.
              </p>

              <h3>Investor &amp; Partner Pitch</h3>
              <p>
                Guardiané unites AI-powered risk detection, tailored parental
                tools, and integrated counselor networks to close the gap in
                digital safety and mental health for children.
              </p>

              <h3>Core Features</h3>
              <ul className="space-y-2">
                {guardianeFeatures.map((item) => (
                  <li key={item.title}>
                    <span className="font-medium text-[var(--foreground)]">
                      {item.title}:
                    </span>{" "}
                    {item.desc}
                  </li>
                ))}
              </ul>

              <h3>Learn more</h3>
              <div className="mt-4">
                <Link
                  href="/guardiane"
                  className="focus-visible-ring outline-btn inline-flex items-center gap-1.5 rounded-sm px-6 py-2.5 text-[0.78rem] font-medium uppercase tracking-[0.12em]"
                >
                  Learn more
                  <span className="pill-btn-icon" aria-hidden>
                    ↗
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY AI-GUARDIAN CENTER ── */}
        <section
          id="why"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title mb-12">
              <h2 className="gradient-heading mb-5 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                Why Our Work Matters
              </h2>
              <p className="clarity-prose text-sm">
                Children and teens are growing up in a digital world filled with
                both opportunities and risks. Families often need better tools
                to recognize warning signs early, guide healthy digital habits,
                and access trustworthy support without overwhelming complexity.
                The AI-Guardian Center addresses this need by integrating safety
                technology, educational empowerment, and human-centered care.
              </p>
            </div>

            <div data-reveal className="clarity-article">
              <ul className="clarity-list space-y-3">
                {whyItems.map((item) => (
                  <li key={item.label}>
                    <span className="font-medium text-[var(--foreground)]">
                      {item.label}:
                    </span>{" "}
                    {item.body}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CORE TEAM ── */}
        <section
          id="team"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title mb-14">
              <h2 className="gradient-heading text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                Core Team Members
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member, i) => (
                <div
                  key={member.name}
                  data-reveal
                  className="clarity-card group p-6 transition-all duration-300 hover:border-[var(--accent-border)]"
                  style={{ transitionDelay: `${(i % 3) * 60}ms` }}
                >
                  <div className="mb-4 min-w-0">
                    <h3 className="text-sm font-semibold leading-snug">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-[var(--accent)]">
                      {member.role}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {member.affiliation}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--muted)]">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CAREERS ── */}
        <section
          id="careers"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div data-reveal>
                <h2 className="gradient-heading mb-6 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                  Join Our Mission
                </h2>
                <p className="clarity-prose text-sm">
                  Join us in shaping the future of child safety, family
                  wellbeing, and responsible AI innovation. The AI-Guardian
                  Center welcomes mission-driven individuals who are passionate
                  about applying technology, research, education, and care to
                  make a meaningful difference in children&apos;s lives.
                </p>
              </div>

              <div data-reveal className="clarity-card p-8">
                <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Potential Career Areas
                </h3>
                <ul className="clarity-list space-y-3">
                  {careerAreas.map((area, i) => (
                    <li key={i} className="text-sm text-[var(--foreground)]">
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── SCHOLARSHIP ── */}
        <section
          id="scholarship"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title">
              <h2 className="gradient-heading mb-6 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                $5,000 Scholarship Initiative
              </h2>
              <p className="clarity-prose text-sm">
                The AI-Guardian Center believes that every child deserves the
                opportunity to grow, learn, and thrive. Through the Guardiané
                Premium Care &amp; Growth plan, families are automatically
                entered for a chance to receive a{" "}
                <strong className="font-semibold text-[var(--foreground)]">
                  $5,000 scholarship
                </strong>{" "}
                to support summer study camps or other study-related
                opportunities for their child. This initiative reflects our
                commitment not only to protection and support, but also to
                growth, confidence, and future opportunity.
              </p>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section
          id="contact"
          className="border-t border-[var(--border)] scroll-mt-20"
        >
          <div className="clarity-wrap flex flex-col px-4 py-24 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="clarity-section-title flex flex-col gap-5"
            >
              <h2 className="gradient-heading max-w-3xl text-4xl font-normal leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                Technology that cares for children, supports parents, and
                strengthens families.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                Through Guardiané and our broader innovation efforts, we are
                building a future where digital safety and mental wellbeing are
                not luxuries, but accessible foundations for every child.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <a
                  href="#"
                  className="focus-visible-ring accent-btn rounded-full px-8 py-3.5 text-sm font-medium"
                >
                  Get Started
                  <span className="pill-btn-icon" aria-hidden>
                    ↗
                  </span>
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="focus-visible-ring brand-btn rounded-full px-8 py-3.5 text-sm font-medium"
                >
                  Contact Us
                  <span className="pill-btn-icon" aria-hidden>
                    ↗
                  </span>
                </a>
                <PartnerWithUsModal
                  email={contactEmail}
                  className="focus-visible-ring outline-btn rounded-full px-8 py-3.5 text-sm font-medium"
                >
                  Partner With Us
                </PartnerWithUsModal>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Link
              href="/"
              className="focus-visible-ring mb-3 flex items-center gap-2.5"
            >
              <span className="center-monogram" aria-hidden>
                AIG
              </span>
              <span className="text-base">AI-Guardian Center</span>
            </Link>
            <p className="max-w-sm text-sm text-[var(--muted)]">
              Protecting children&apos;s digital safety and mental wellbeing
              through responsible AI innovation. Home of Guardiané—real-time
              safety intelligence for families.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Center
              </p>
              <Link
                href="#about"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                About
              </Link>
              <Link
                href="#team"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Team
              </Link>
              <Link
                href="#careers"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Careers
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Product
              </p>
              <Link
                href="/guardiane"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Guardiané
              </Link>
              <Link
                href="#why"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Why Us
              </Link>
              <Link
                href="#scholarship"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Scholarship
              </Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Legal
              </p>
              <span className="block text-[var(--muted)]">Privacy Policy</span>
              <span className="block text-[var(--muted)]">
                Terms of Service
              </span>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                Contact
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Contact Us
              </a>
              <PartnerWithUsModal
                email={contactEmail}
                className="focus-visible-ring block text-left text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Partner With Us
              </PartnerWithUsModal>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AI-Guardian Center. All rights reserved.
        </div>
      </footer>
    </>
  );
}
