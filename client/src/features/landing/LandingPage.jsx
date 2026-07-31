import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Brain, Shield, BarChart3, Code2, Users, ArrowRight, Sparkles,
  Target, Menu, X, ChevronLeft, ChevronRight, Zap, Globe,
  TrendingUp, Star, CheckCircle2, Play,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return { count, ref }
}

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Generation', desc: 'Generate smart questions automatically using advanced AI models with customizable difficulty and topics.', color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.15)' },
  { icon: Shield, title: 'Real-time Proctoring', desc: 'Webcam monitoring, tab-switch detection, and audio analysis to ensure exam integrity.', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.15)' },
  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Score trends, performance breakdowns, AI-powered insights, and PDF/CSV export.', color: 'from-blue-500 to-cyan-600', glow: 'rgba(59,130,246,0.15)' },
  { icon: Code2, title: 'Coding Assessments', desc: 'Built-in code editor with 5 language support, instant execution, and AI-powered hints.', color: 'from-orange-500 to-red-600', glow: 'rgba(249,115,22,0.15)' },
  { icon: Target, title: 'Smart Question Bank', desc: 'Organize, tag, and manage questions. Import from files, AI generate, and approval workflows.', color: 'from-pink-500 to-rose-600', glow: 'rgba(236,72,153,0.15)' },
  { icon: Users, title: 'Role-Based Access', desc: 'Separate dashboards for candidates, setters, and admins. Tailored experiences for each role.', color: 'from-amber-500 to-yellow-600', glow: 'rgba(245,158,11,0.15)' },
]

const STATS = [
  { value: 10000, suffix: '+', label: 'Active Users' },
  { value: 50000, suffix: '+', label: 'Assessments Created' },
  { value: 98, suffix: '%', label: 'Satisfaction Rate' },
  { value: 24, suffix: '/7', label: 'Platform Uptime' },
]

const STEPS = [
  { icon: Users, title: 'Create Account', desc: 'Sign up as a candidate or setter in seconds.' },
  { icon: Sparkles, title: 'Generate or Attempt', desc: 'Create assessments with AI or take them.' },
  { icon: BarChart3, title: 'Track Progress', desc: 'View analytics, leaderboards, and insights.' },
]

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Engineering Lead at TechCorp', avatar: 'SC', text: 'AssessAI transformed our hiring process. We went from 2 weeks to 3 days for technical screenings. The AI-generated questions are incredibly relevant.', rating: 5 },
  { name: 'Marcus Johnson', role: 'HR Director at StartupXYZ', avatar: 'MJ', text: 'The proctoring features give us confidence in remote assessments. Real-time monitoring without being intrusive. Game changer for our team.', rating: 5 },
  { name: 'Priya Sharma', role: 'CTO at InnovateLab', avatar: 'PS', text: 'Best assessment platform we have used. The coding assessments with live execution are perfect for evaluating developers. Highly recommended.', rating: 5 },
]

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  )
}

function GridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-primary), transparent)',
        opacity: 0.08,
      }} />
    </div>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg-primary/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-heading font-bold text-text-primary">AssessAI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {['Features', 'How it Works', 'Testimonials'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary/50">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-tertiary/50">
            Sign in
          </Link>
          <Link to="/register"
            className="group relative px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 overflow-hidden">
            <span className="relative z-10">Get started free</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-bg-primary/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {['Features', 'How it Works', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 rounded-lg transition-colors">
                  {item}
                </a>
              ))}
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 rounded-lg transition-colors text-center">
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl text-center">
                  Get started free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 150])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <GridBackground />
      <FloatingOrbs />

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Assessment Platform</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-extrabold leading-[1.05] tracking-tight">
              <span className="text-text-primary">Build Smarter </span>
              <br />
              <span className="text-text-primary">Assessments with </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                AI Intelligence
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-lg text-text-secondary leading-relaxed max-w-lg">
              Create, manage, and analyze assessments with AI-powered question generation, real-time proctoring, and instant analytics.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/register"
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-2xl hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 overflow-hidden">
                <span className="relative z-10">Start for free</span>
                <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-0.5 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-text-primary border border-border rounded-2xl hover:bg-bg-tertiary hover:border-border-light transition-all duration-300">
                <Play className="h-4 w-4" />
                Sign in to your account
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-sm text-text-tertiary">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Free forever for basics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative perspective-1000">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm shadow-2xl shadow-black/20 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-secondary/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 text-center text-xs text-text-tertiary font-mono">AssessAI Dashboard</div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-tertiary">Total Assessments</p>
                      <p className="text-2xl font-heading font-bold text-text-primary">1,247</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-success font-medium bg-success/10 px-2.5 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      +23%
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Active', value: '89', color: 'bg-primary/10 text-primary' },
                      { label: 'Completed', value: '1,158', color: 'bg-success/10 text-success' },
                      { label: 'Avg Score', value: '76%', color: 'bg-accent/10 text-accent' },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl p-3 ${s.color.split(' ')[0]}`}>
                        <p className={`text-lg font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                        <p className="text-[10px] text-text-tertiary">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {['React Fundamentals', 'Node.js Advanced', 'System Design'].map((q, i) => (
                      <div key={q} className="flex items-center gap-3 rounded-xl bg-bg-tertiary/50 px-4 py-3">
                        <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-success' : i === 1 ? 'bg-primary' : 'bg-accent'}`} />
                        <span className="text-sm text-text-primary flex-1">{q}</span>
                        <span className="text-xs text-text-tertiary">{[92, 85, 78][i]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}

function StatItem({ value, suffix, label }) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref} className="text-center group">
      <p className="text-4xl sm:text-5xl font-heading font-extrabold bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-transparent">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-text-secondary">{label}</p>
    </div>
  )
}

function StatsSection() {
  return (
    <section className="relative border-y border-border bg-bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, suffix, label }) => (
            <StatItem key={label} value={value} suffix={suffix} label={label} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 mb-6">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium text-accent">Powerful Features</span>
        </motion.div>
        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary">
          Everything you need to
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> assess smarter</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="mt-4 text-text-secondary max-w-xl mx-auto">
          A complete assessment platform with tools for creation, delivery, proctoring, and analysis.
        </motion.p>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc, color, glow }) => (
          <motion.div key={title} variants={fadeUp}
            className="group relative rounded-2xl border border-border bg-bg-card p-7 hover:border-transparent transition-all duration-500 overflow-hidden"
            style={{ '--glow': glow }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glow}, transparent 60%)` }} />
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-border-light/50 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg mb-5`}
                style={{ boxShadow: `0 8px 30px ${glow}` }}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-heading font-bold text-text-primary mb-2">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative border-t border-border bg-bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Simple Process</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary">
            How it works
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-text-secondary">
            Get started in three simple steps.
          </motion.p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}
            className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} variants={fadeUp} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border group-hover:border-primary/30 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-lg shadow-primary/25">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-text-primary mb-2">{title}</h3>
                  <p className="text-sm text-text-secondary max-w-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/5 px-4 py-1.5 mb-6">
          <Star className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium text-warning">Testimonials</span>
        </motion.div>
        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary">
          Loved by teams worldwide
        </motion.h2>
      </motion.div>

      <div className="relative max-w-3xl mx-auto">
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 sm:p-12"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: TESTIMONIALS[current].rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-lg text-text-primary leading-relaxed mb-8">
                &ldquo;{TESTIMONIALS[current].text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                  {TESTIMONIALS[current].avatar}
                </div>
                <div>
                  <p className="font-heading font-semibold text-text-primary">{TESTIMONIALS[current].name}</p>
                  <p className="text-sm text-text-secondary">{TESTIMONIALS[current].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => setCurrent((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            className="h-10 w-10 rounded-full border border-border bg-bg-card flex items-center justify-center hover:bg-bg-tertiary transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-border-light'}`} />
            ))}
          </div>
          <button onClick={() => setCurrent((p) => (p + 1) % TESTIMONIALS.length)}
            className="h-10 w-10 rounded-full border border-border bg-bg-card flex items-center justify-center hover:bg-bg-tertiary transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-accent" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />

          <div className="relative px-8 py-16 sm:px-12 sm:py-20 text-center">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white mb-4">
              Ready to get started?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/80 max-w-lg mx-auto mb-10">
              Join thousands of teams using AssessAI to build smarter, faster, and fairer assessments.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold text-primary bg-white rounded-2xl hover:bg-white/90 hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
                Create free account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                Sign in
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading font-bold text-text-primary">AssessAI</span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              AI-powered assessment platform for modern teams.
            </p>
          </div>
          {[
            { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#' }, { label: 'Changelog', href: '#' }, { label: 'Docs', href: '#' }] },
            { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Contact', href: '#' }] },
            { title: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Security', href: '#' }, { label: 'GDPR', href: '#' }] },
          ].map((col) => (
            <div key={col.title}>
              <p className="font-heading font-semibold text-text-primary mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{label}</Link>
                    ) : (
                      <a href={href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">&copy; 2026 AssessAI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[
              { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-8h2v8z', label: 'GitHub' },
            ].map((s) => (
              <a key={s.label} href="#" className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-tertiary hover:text-text-primary hover:border-border-light transition-colors">
                <Globe className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
