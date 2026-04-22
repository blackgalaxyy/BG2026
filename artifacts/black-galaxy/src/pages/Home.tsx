import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useSpring, useInView, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Brain3D } from '@/components/Brain3D';
import logoImage from '@assets/ChatGPT_Image_Apr_22,_2026,_09_03_13_PM_1776872020834.png';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, Cpu, Layers, BarChart, Shield, Zap, Target, Globe, ChevronUp, ArrowRight } from 'lucide-react';

// ─── Animated section reveal ─────────────────────────────────────────
const FadeIn = ({ children, delay = 0, className = "", direction = "up" as "up"|"left"|"right"|"none" }: {
  children: React.ReactNode; delay?: number; className?: string; direction?: "up"|"left"|"right"|"none";
}) => {
  const initial = direction === "up" ? { opacity: 0, y: 40 } :
    direction === "left" ? { opacity: 0, x: -40 } :
    direction === "right" ? { opacity: 0, x: 40 } :
    { opacity: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Stagger container ───────────────────────────────────────────────
const StaggerGrid = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
    className={className}
  >
    {children}
  </motion.div>
);
const StaggerItem = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 30, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.23,1,0.32,1] } } }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Tilt card ───────────────────────────────────────────────────────
const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    ref.current.style.transform = `perspective(1000px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) scale(1.02)`;
  };
  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-card ${className}`}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.4s ease, border-color 0.4s ease' }}
    >
      {children}
    </div>
  );
};

// ─── Animated stat counter ───────────────────────────────────────────
const StatCounter = ({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

// ─── Navbar ──────────────────────────────────────────────────────────
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("Home");
  const sections = ['Home', 'About', 'Products', 'Technology', 'Contact'];

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const scrollPos = window.scrollY + 120;
      for (const s of sections) {
        const el = document.getElementById(s.toLowerCase());
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) setActive(s);
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#home" className="flex items-center cursor-pointer group">
          <motion.img
            src={logoImage}
            alt="Black Galaxy"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="h-12 w-auto object-contain"
          />
        </a>
        <div className="hidden md:flex items-center gap-8">
          {sections.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className={`nav-link text-sm font-medium ${active === item ? 'active' : ''}`}>
              {item}
            </a>
          ))}
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 rounded-md btn-lava text-sm font-bold tracking-wide"
          >
            Request Demo
          </motion.a>
        </div>
      </div>
    </motion.nav>
  );
};

// ─── Scroll progress bar ─────────────────────────────────────────────
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div className="scroll-progress" style={{ scaleX, width: '100%' }} />;
};

// ─── Cursor glow ─────────────────────────────────────────────────────
const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  useEffect(() => {
    const handle = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);
  return (
    <div className="cursor-glow" style={{ left: pos.x, top: pos.y }} />
  );
};

// ─── Section heading ─────────────────────────────────────────────────
const SectionHeading = ({ label, title, accent, sub }: { label?: string; title: string; accent?: string; sub?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div className="text-center max-w-3xl mx-auto mb-16" ref={ref}>
      {label && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          className="inline-block px-4 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4"
        >{label}</motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1, ease: [0.23,1,0.32,1] }}
        className="text-4xl md:text-5xl font-black text-white mb-4"
      >
        {title} {accent && <span className="text-gradient-lava">{accent}</span>}
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.7, delay: 0.25 }}
          className="text-lg text-muted-foreground"
        >{sub}</motion.p>
      )}
    </div>
  );
};

// ─── Footer ──────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="border-t border-white/5 pt-20 pb-10" style={{ background: 'linear-gradient(180deg, #0e0e18 0%, #0a0a12 100%)' }}>
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center mb-6">
            <img src={logoImage} alt="Black Galaxy" className="h-14 w-auto object-contain" />
          </div>
          <p className="text-muted-foreground max-w-sm leading-relaxed">Engineering intelligence systems for the real world. We build AI that evaluates, decides, and optimizes at scale.</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">Ecosystem</h4>
          <ul className="space-y-3">
            {['Vyona Engine', 'Workforce Intelligence', 'Decision Optimization', 'Autonomous Systems'].map(l => (
              <li key={l}><a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide">Company</h4>
          <ul className="space-y-3">
            {[['#about','About Us'],['#technology','Technology'],['#contact','Contact']].map(([href, label]) => (
              <li key={label}><a href={href} className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">{label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="section-divider mb-8" />
      <div className="flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Black Galaxy. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Globe size={18} /></a>
        </div>
      </div>
    </div>
  </footer>
);

// ─── Main Home ───────────────────────────────────────────────────────
export default function Home() {

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <ScrollProgress />
      <CursorGlow />
      <Navbar />

      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20" style={{ background: '#000000' }}>
        {/* Brain — full canvas, centered */}
        <Brain3D />

        {/* Radial dark centre so text pops over the bright brain */}
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.38) 0%, transparent 75%)' }} />

        {/* All hero content — vertically + horizontally centred */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full pointer-events-none">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23,1,0.32,1] }}
            className="mb-8"
          >
            <span className="inline-block px-5 py-2 rounded-full border border-primary/40 bg-black/50 text-primary text-xs font-bold tracking-[0.22em] uppercase backdrop-blur-md">
              The Future of Autonomous Evaluation
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[5.2rem] font-black tracking-tight leading-[1.1] mb-6">
            {/* Line 1: Engineering (white) + Intelligence (orange) */}
            <div>
              {[['Engineering', false], ['Intelligence', true]].map(([word, orange], i) => (
                <motion.span
                  key={String(word)}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease: [0.23,1,0.32,1] }}
                  className="inline-block mr-4"
                  style={orange ? {
                    background: 'linear-gradient(135deg,#ff4500 0%,#ff8c00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } : { color: '#ffffff' }}
                >{word}</motion.span>
              ))}
            </div>
            {/* Line 2: Systems (orange) + for the Real World (white) */}
            <div>
              {[['Systems', true], ['for', false], ['the', false], ['Real', false], ['World', false]].map(([word, orange], i) => (
                <motion.span
                  key={String(word)}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.58 + i * 0.1, ease: [0.23,1,0.32,1] }}
                  className="inline-block mr-4"
                  style={orange ? {
                    background: 'linear-gradient(135deg,#ff4500 0%,#ff8c00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } : { color: '#ffffff' }}
                >{word}</motion.span>
              ))}
            </div>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mb-10 font-light leading-relaxed"
          >
            Black Galaxy builds AI-driven systems that evaluate, decide and optimize —
            transforming how organizations operate, hire and scale.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.45 }}
            className="flex flex-row flex-wrap items-center justify-center gap-4 pointer-events-auto"
          >
            <motion.a
              href="#products"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3.5 rounded-md btn-lava text-base font-bold tracking-wide flex items-center gap-2"
            >
              Explore Products <ArrowRight size={18} />
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3.5 rounded-md btn-mercury text-base font-bold tracking-wide"
            >
              Request Demo
            </motion.a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="absolute bottom-8 right-14 flex flex-col items-center gap-2 pointer-events-none z-10"
        >
          <span className="text-[10px] tracking-widest text-muted-foreground/60 uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="w-px h-7 bg-gradient-to-b from-primary/60 to-transparent" />
        </motion.div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-12 relative" style={{ background: 'linear-gradient(90deg, rgba(255,80,0,0.06) 0%, rgba(20,20,30,1) 30%, rgba(20,20,30,1) 70%, rgba(255,80,0,0.06) 100%)' }}>
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="max-w-7xl mx-auto px-6">
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: 10, suffix: "x", label: "Faster Evaluation" },
              { n: 99, suffix: "%", label: "Accuracy Rate" },
              { n: 500, suffix: "+", label: "Profiles Analyzed" },
              { n: 0, suffix: "", label: "Human Bias", prefix: "~" },
            ].map((s, i) => (
              <StaggerItem key={i}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-primary mb-2">
                    <StatCounter target={s.n} suffix={s.suffix} prefix={s.prefix} />
                  </div>
                  <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">{s.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
        <div className="section-divider absolute bottom-0 left-0 right-0" />
      </section>

      {/* ── INTRO ── */}
      <section id="about" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/neural-bg.png')] bg-cover bg-center opacity-[0.04] mix-blend-luminosity pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <FadeIn direction="left">
                <div className="inline-block px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6">About Us</div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 text-white leading-tight">
                  We Don't Build Tools.<br /><span className="text-gradient-lava">We Build Intelligent Systems.</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                  Most AI companies build chat interfaces or simple co-pilots. Black Galaxy engineers autonomous engines capable of deep evaluation, multi-variable decision making, and real-time optimization.
                </p>
                <motion.a href="#products" whileHover={{ x: 6 }} className="inline-flex items-center gap-2 text-primary font-bold text-sm tracking-wide hover:gap-4 transition-all duration-300">
                  Explore Our Products <ArrowRight size={16} />
                </motion.a>
              </FadeIn>
            </div>
            <div className="lg:w-1/2 w-full">
              <FadeIn delay={0.3} direction="right">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-orange-600/10 rounded-2xl blur-3xl opacity-60 transform -rotate-2 scale-105 animate-pulse" />
                  <TiltCard className="relative rounded-2xl overflow-hidden border border-white/8 shadow-2xl aspect-[4/3]">
                    <img src="/images/neural-bg.png" alt="AI Intelligence" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-white/80 text-sm font-bold tracking-widest uppercase">Neural Intelligence Architecture</p>
                    </div>
                  </TiltCard>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── VISION & MISSION ── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StaggerItem>
              <TiltCard className="p-10 rounded-2xl h-full lava-border">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Target className="icon-lava w-12 h-12 text-primary mb-6" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 text-white">Vision</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">To become the central intelligence layer for modern organizations, where our AI systems autonomously evaluate complex data and optimize critical decisions across the entire enterprise.</p>
              </TiltCard>
            </StaggerItem>
            <StaggerItem>
              <TiltCard className="p-10 rounded-2xl h-full lava-border">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <motion.div whileHover={{ rotate: -10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Zap className="icon-lava w-12 h-12 text-primary mb-6" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 text-white">Mission</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">To engineer uncompromised, precision-driven AI products that replace manual evaluation with instant, unbiased intelligence, allowing human capital to focus purely on strategic execution.</p>
              </TiltCard>
            </StaggerItem>
          </StaggerGrid>
        </div>
      </section>

      {/* ── WHAT WE BUILD ── */}
      <section className="py-32 relative" style={{ backgroundColor: '#12121c' }}>
        <div className="absolute inset-0 bg-[url('/images/neural-bg.png')] bg-cover bg-center opacity-[0.05] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading label="Capabilities" title="What We" accent="Build" />
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              { icon: Layers, title: "Autonomous Evaluation", desc: "Systems that ingest unstructured data and output structured decisions." },
              { icon: BarChart, title: "Predictive Engines", desc: "Models trained to forecast outcomes based on historical patterns." },
              { icon: Shield, title: "Unbiased Analysis", desc: "Removing human prejudice from critical operational evaluations." },
              { icon: Zap, title: "Real-time Processing", desc: "Instantaneous parsing of thousands of data points." },
              { icon: Cpu, title: "Scalable Intelligence", desc: "Architecture designed to grow linearly with organizational needs." }
            ].map((item, i) => (
              <StaggerItem key={i}>
                <TiltCard className="p-8 rounded-xl h-full flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary"
                    style={{ boxShadow: '0 0 20px rgba(255,80,0,0.15)' }}
                  >
                    <item.icon size={28} />
                  </motion.div>
                  <h4 className="text-lg font-bold mb-3 text-white">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── VYONA ── */}
      <section id="products" className="py-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <FadeIn direction="left">
                <div className="inline-block px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6">Flagship Model</div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
                  VYONA<br />
                  <span className="text-gradient-lava text-3xl md:text-4xl">Candidate Intelligence Engine</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Vyona is not an ATS. It is an autonomous intelligence system that reads, analyzes, and evaluates technical talent with the precision of a Senior Engineering Manager.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    'Deep syntax and logic evaluation of code submissions',
                    'Pattern recognition across thousands of candidate profiles',
                    'Instant, bias-free competency scoring',
                    'Automated technical interviewing and assessment'
                  ].map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex items-center gap-3 text-white/80 group"
                    >
                      <div className="feature-dot" />
                      <span className="group-hover:text-white transition-colors duration-200">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.a href="#contact" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-md btn-lava text-lg font-bold tracking-wide inline-flex items-center justify-center gap-2"
                >
                  Explore Vyona <ChevronRight size={20} />
                </motion.a>
              </FadeIn>
            </div>
            <div className="lg:w-1/2 w-full">
              <FadeIn delay={0.3} direction="right">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 rounded-2xl blur-2xl opacity-25 transform rotate-3 scale-105 animate-pulse" />
                  <TiltCard className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3]">
                    <img src="/images/neural-bg.png" alt="Vyona Intelligence Interface" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center px-8">
                        <div className="text-6xl font-black text-gradient-lava mb-2">VYONA</div>
                        <div className="text-sm tracking-widest text-white/60 uppercase">Intelligence Engine v1.0</div>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUTURE MODELS ── */}
      <section className="py-32 relative" style={{ backgroundColor: '#12121c' }}>
        <div className="absolute inset-0 bg-[url('/images/future-models.png')] bg-cover bg-center opacity-[0.06] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading label="Roadmap" title="Building" accent="What's Next" sub="The Black Galaxy ecosystem is expanding. Our engineering roadmap includes distinct autonomous systems for every critical business function." />

          <FadeIn className="mb-12">
            <div className="relative rounded-2xl overflow-hidden border border-white/8 h-56 group">
              <img src="/images/future-models.png" alt="Future AI Models" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
              <div className="absolute inset-0 flex items-center px-10">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Roadmap 2025–2027</p>
                  <p className="text-2xl font-black text-white">The Next Generation<br />of Autonomous Systems</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Workforce Intelligence", desc: "Predictive modeling for talent retention, team composition, and productivity optimization." },
              { title: "Decision Optimization", desc: "Algorithmic resource allocation and strategic planning systems." },
              { title: "Predictive Analytics", desc: "Deep-time forecasting models for market trends and internal performance." },
              { title: "Autonomous Evaluation", desc: "Systems that expand beyond hiring into compliance, security, and code review." }
            ].map((model, i) => (
              <StaggerItem key={i}>
                <TiltCard className="p-8 rounded-xl lava-border">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors duration-300">{model.title}</h3>
                    <motion.div whileHover={{ rotate: 45, scale: 1.2 }} transition={{ type: "spring", stiffness: 400 }}>
                      <ChevronUp className="w-6 h-6 text-primary/40" />
                    </motion.div>
                  </div>
                  <p className="text-muted-foreground">{model.desc}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── WHY BLACK GALAXY ── */}
      <section id="technology" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading label="Technology" title="Why Choose" accent="Black Galaxy" />

          <FadeIn className="mb-16">
            <div className="relative rounded-2xl overflow-hidden border border-white/8 h-48 group">
              <img src="/images/neural-bg.png" alt="Technology" className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/30 to-background/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">Built Different</p>
                  <p className="text-3xl font-black text-white">Precision. Scale. <span className="shimmer-text">Intelligence.</span></p>
                </div>
              </div>
            </div>
          </FadeIn>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <StaggerItem className="md:col-span-2">
              <TiltCard className="p-10 rounded-2xl h-full" style={{ borderTop: '3px solid #ff4500' }}>
                <h3 className="text-2xl font-bold mb-4 text-white">Engineering Excellence</h3>
                <p className="text-muted-foreground text-lg">We don't rely on wrappers. Our systems are built from the ground up utilizing proprietary architectures, advanced LLM orchestration, and deterministic logic gates to ensure absolute reliability.</p>
              </TiltCard>
            </StaggerItem>
            <StaggerItem>
              <TiltCard className="p-10 rounded-2xl h-full" style={{ borderTop: '3px solid #ff8c00' }}>
                <h3 className="text-2xl font-bold mb-4 text-white">Zero Compromise</h3>
                <p className="text-muted-foreground text-lg">Precision over speed. Quality over quantity. Every output from a Black Galaxy system is designed to be actionable.</p>
              </TiltCard>
            </StaggerItem>
          </StaggerGrid>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Scalable by Design", desc: "Built on cloud-native microservices capable of evaluating one profile or one million simultaneously." },
              { title: "Data Security", desc: "Enterprise-grade encryption, SOC2 compliance roadmaps, and isolated tenant architectures." },
              { title: "Continuous Evolution", desc: "Our models learn. The system you use today will be demonstrably smarter tomorrow." }
            ].map((c, i) => (
              <StaggerItem key={i}>
                <TiltCard className="p-10 rounded-2xl h-full">
                  <h3 className="text-2xl font-bold mb-4 text-white">{c.title}</h3>
                  <p className="text-muted-foreground">{c.desc}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-32 relative border-t border-white/5" style={{ backgroundColor: '#12121c' }}>
        <div className="absolute inset-0 bg-grid opacity-8 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <FadeIn direction="left">
                <h2 className="text-5xl md:text-6xl font-black mb-8 text-white leading-tight">
                  Transform Your Organization with <span className="text-gradient-lava">Intelligence</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-12">Stop relying on outdated manual processes. Deploy autonomous intelligence systems that scale infinitely and decide precisely.</p>
                <div className="space-y-6">
                  {[
                    { icon: Globe, label: "Location", value: "Mangalore, India" },
                    { icon: Zap, label: "Email", value: "contact@blackgalaxy.com" },
                    { icon: Target, label: "Phone", value: "+91 7204650153" },
                  ].map(({ icon: Icon, label, value }, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.5 }}
                      className="flex items-center gap-4 group"
                    >
                      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary" style={{ boxShadow: '0 0 15px rgba(255,80,0,0.15)' }}>
                        <Icon size={20} />
                      </motion.div>
                      <div>
                        <h4 className="font-bold text-white">{label}</h4>
                        <p className="text-muted-foreground">{value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2} direction="right">
              <TiltCard className="p-10 rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary via-orange-400 to-primary animate-[shimmer_3s_linear_infinite] bg-[length:200%_auto]" />
                <h3 className="text-2xl font-bold mb-8 text-white">Request System Access</h3>
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  {[
                    { label: "Full Name", type: "text", placeholder: "John Doe" },
                    { label: "Corporate Email", type: "email", placeholder: "john@company.com" },
                    { label: "Company", type: "text", placeholder: "Acme Inc." },
                  ].map(({ label, type, placeholder }) => (
                    <div key={label} className="space-y-2">
                      <label className="text-sm font-medium text-white/70">{label}</label>
                      <Input type={type} className="bg-background/40 border-white/8 focus:border-primary text-white h-12 transition-all duration-300 focus:shadow-[0_0_20px_rgba(255,80,0,0.15)]" placeholder={placeholder} />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Operational Needs</label>
                    <Textarea className="bg-background/40 border-white/8 focus:border-primary text-white min-h-[110px] transition-all duration-300 focus:shadow-[0_0_20px_rgba(255,80,0,0.15)]" placeholder="Tell us about the systems you want to automate..." />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 btn-lava text-lg font-bold rounded-md"
                  >
                    Initialize Contact
                  </motion.button>
                </form>
              </TiltCard>
            </FadeIn>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
