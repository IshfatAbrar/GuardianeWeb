import Link from "next/link";
import {
  Radar,
  BookOpen,
  HeartHandshake,
  Stethoscope,
  Eye,
  Target,
  ListChecks,
} from "lucide-react";
import { Accordion } from "../components/accordion";
import { GuardianeDeviceMockup } from "../components/guardiane-device-mockup";
import { HeroHalfBox } from "../components/hero-half-box";
import { JojoPreviewCard } from "../components/jojo-preview-card";
import { PartnerWithUsModal } from "../components/partner-with-us-modal";
import { SiteFooter } from "../components/site-footer";
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

// Longer copy, stashed for later — swap back in if we want more detail:
// "Detect digital safety and emotional risk signals in real time"
// "Support parents with practical, personalized guidance"
// "Provide children and teens with developmentally appropriate learning resources"
// "Connect families with trusted counseling and crisis support when needed"
// "Prioritize privacy-preserving, responsible AI design"
const aboutPillars = [
  {
    title: "Our Vision",
    desc: "A future where every child can grow and explore online safely.",
    icon: Eye,
  },
  {
    title: "Our Mission",
    desc: "Real-time alerts, parental guidance, and trusted counselor access.",
    icon: Target,
  },
  {
    title: "What We Do",
    desc: "Detect risks, guide parents, and connect families to trusted care.",
    icon: ListChecks,
  },
];

const guardianeFeatures = [
  {
    title: "Intelligent Monitoring",
    desc: "Real-time detection of digital safety and emotional risk signals",
    icon: Radar,
  },
  {
    title: "Dynamic Education",
    desc: "Developmentally appropriate content for children and teens",
    icon: BookOpen,
  },
  {
    title: "Parental Guidance",
    desc: "Personalized, practical tools tailored to every family",
    icon: HeartHandshake,
  },
  {
    title: "Counselor Networks",
    desc: "Seamless access to vetted mental health professionals",
    icon: Stethoscope,
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

const joinUsFaqs = [
  {
    title: "Why join us?",
    content: (
      <p>
        Join us in shaping the future of child safety, family wellbeing,
        and responsible AI innovation. We welcome mission-driven
        individuals passionate about applying technology, research,
        education, and care to make a meaningful difference in
        children&apos;s lives.
      </p>
    ),
  },
  {
    title: "Potential career areas",
    content: (
      <ul className="clarity-list space-y-2">
        {careerAreas.map((area, i) => (
          <li key={i}>{area}</li>
        ))}
      </ul>
    ),
  },
  {
    title: "$5,000 scholarship initiative",
    content: (
      <p>
        The AI-Guardian Center believes every child deserves the
        opportunity to grow, learn, and thrive. Through the Guardiané
        Premium Care &amp; Growth plan, families are automatically
        entered for a chance to receive a{" "}
        <strong className="font-semibold text-[var(--foreground)]">
          $5,000 scholarship
        </strong>{" "}
        to support summer study camps or other study-related
        opportunities for their child.
      </p>
    ),
  },
];

export default function Home() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip text-[var(--foreground)]">
        {/* ── HERO ── */}
        <section className="bg-[var(--background)]">
          <HeroHalfBox>
            <div className="clarity-wrap flex flex-col items-center px-4 pb-4 pt-4 text-center sm:px-6 lg:px-8 lg:pt-12">
              {/* social proof badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-1.5 pr-4 shadow-sm">
                <div className="flex -space-x-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] text-[10px] font-semibold text-white"
                    style={{ background: "#1d4ed8" }}
                  >
                    J
                  </span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] text-[10px] font-semibold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    M
                  </span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] text-[10px] font-semibold text-white"
                    style={{ background: "#93c5fd" }}
                  >
                    A
                  </span>
                </div>
                <span className="text-xs font-medium text-[var(--foreground)]">
                  100+ joined
                </span>
              </div>

              <h1 className="gradient-heading mt-7 max-w-2xl text-[2.8rem] font-normal leading-[1.08] tracking-[-0.045em] sm:text-[3.8rem] lg:text-[4.2rem]">
                Safer Kids. <br /> Stronger Families.
              </h1>

              <div className="mt-8">
                <Link
                  href="/guardiane"
                  className="focus-visible-ring inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{ backgroundColor: "#262626", color: "#ffffff" }}
                >
                  Explore Guardiané
                </Link>
              </div>
            </div>

            {/* ── EMBEDDED APP PREVIEW ── */}
            <div className="clarity-wrap px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-16">
              <JojoPreviewCard />
            </div>
          </HeroHalfBox>
        </section>

        {/* ── FLAGSHIP: GUARDIANÉ ── */}
        <section
          id="why"
          className="scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title mb-14 text-center">
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-medium text-[var(--muted)]">
                Guardiané
              </span>

              <h2 className="gradient-heading mt-5 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                AI safety, built around your family
              </h2>

              <p className="clarity-prose mx-auto mt-5 max-w-4xl text-sm">
                Guardiané pairs real-time risk detection with vetted
                counselor support and educational tools, so families get
                both the technology and the human care digital safety
                requires.
              </p>
            </div>

            <div data-reveal className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:items-center">
              <div>
                
                <ul className="mt-9 space-y-3">
                  {guardianeFeatures.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.title}
                        className={`flex items-start gap-3 rounded-xl p-4 ${
                          "border border-transparent"
                        }`}
                      >
                        <Icon
                          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]"
                          aria-hidden
                        />
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8">
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

              <GuardianeDeviceMockup
                laptopSrc="/hero-laptop.png"
                phoneSrc="/hero-phone.png"
              />
            </div>
          </div>
        </section>

        {/* ── ABOUT THE CENTER + CORE TEAM ── */}
        <section
          id="about"
          className="scroll-mt-20 p-5 px-8"
        >
          <div id="team" className="scroll-mt-20 py-24 pb-16 rounded-xl bg-gradient-to-t from-[#93c5fd] to-[#dbeafe] shadow-sm">
            <div className="clarity-wrap px-4 sm:px-6 lg:px-8">
              <div data-reveal className="clarity-section-title mb-14 text-center">
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-medium text-[var(--muted)]">
                About Us
              </span>

              <h2 className="gradient-heading mt-5 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                Building safer digital futures together.
              </h2>

              <p className="clarity-prose mx-auto mt-5 max-w-4xl text-sm">
                We are a multidisciplinary team of experts in AI, education, mental health, and responsible technology, working together to protect children and support families in the digital world.
              </p>
            </div>
            </div>

            {/* full-bleed auto-scrolling carousel */}
            <div data-reveal className="marquee-row relative overflow-hidden py-2">
              <div className="marquee-track flex w-max gap-5 px-4">
                {[...teamMembers, ...teamMembers].map((member, i) => (
                  <div
                    key={`${member.name}-${i}`}
                    className="clarity-card w-72 shrink-0 p-6 sm:w-80"
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
          </div>

          {/* vision / mission / what we do — below the carousel */}
          <div className="clarity-wrap px-4 py-12 sm:px-6 lg:px-8">
            <div
              data-reveal
              className="grid gap-10 sm:grid-cols-3 sm:divide-x sm:divide-[var(--border)]"
            >
              {aboutPillars.map(({ title, desc, icon: Icon }, i) => (
                <div
                  key={title}
                  className={`flex items-center justify-center gap-3.5 text-center ${i === 0 ? "" : "sm:px-8"}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* ── CAREERS + SCHOLARSHIP ── */}
        <section
          id="careers"
          className="scroll-mt-20"
        >
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div data-reveal>
                <h2 className="gradient-heading mb-6 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                  Join Our Mission
                </h2>
                <p className="clarity-prose text-sm">
                  Join us in shaping the future of child safety, family
                  wellbeing, and responsible AI innovation.
                </p>
                <div className="mt-8">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="focus-visible-ring inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
                    style={{ backgroundColor: "#262626", color: "#ffffff" }}
                  >
                    Contact Us
                  </a>
                </div>
              </div>

              <div id="scholarship" data-reveal className="scroll-mt-20">
                <Accordion items={joinUsFaqs} />
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section
          id="contact"
          className="scroll-mt-20"
        >
          <div className="clarity-wrap relative flex flex-col overflow-hidden rounded-xl mb-14 px-4 py-24 sm:px-6 lg:px-8 shadow-sm">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/cta-bg.jpg)" }}
            />
            <div
              className="absolute -inset-6 scale-110 bg-cover bg-center blur-2xl"
              style={{
                backgroundImage: "url(/cta-bg.jpg)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 55%, black 100%)",
                maskImage:
                  "radial-gradient(circle at center, transparent 55%, black 100%)",
              }}
            />
            <div className="absolute inset-0 bg-white/55" />

            <div
              data-reveal
              className="clarity-section-title relative z-10 flex flex-col gap-5"
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

      <SiteFooter />
    </>
  );
}
