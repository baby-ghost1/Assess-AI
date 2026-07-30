import { Link } from 'react-router-dom'
import { Brain, Shield, BarChart3, Code2, Users, ArrowRight, Sparkles, Target } from 'lucide-react'

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Generation', desc: 'Generate smart questions automatically using advanced AI models. Customizable difficulty, topics, and question types.' },
  { icon: Shield, title: 'Real-time Proctoring', desc: 'Webcam monitoring, tab-switch detection, and audio analysis to ensure exam integrity.' },
  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Score trends, performance breakdowns, AI-powered insights, and PDF/CSV export for detailed reporting.' },
  { icon: Code2, title: 'Coding Assessments', desc: 'Built-in code editor with 5 language support, instant execution, and AI-powered hints.' },
  { icon: Target, title: 'Smart Question Bank', desc: 'Organize, tag, and manage questions. Import from files, AI generate, and approval workflows.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Separate dashboards for candidates, setters, and admins. Tailored experiences for each role.' },
]

const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '50K+', label: 'Assessments Created' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Platform Uptime' },
]

const STEPS = [
  { icon: Users, title: 'Create Account', desc: 'Sign up as a candidate or setter in seconds.' },
  { icon: Sparkles, title: 'Generate or Attempt', desc: 'Create assessments with AI or take them.' },
  { icon: BarChart3, title: 'Track Progress', desc: 'View analytics, leaderboards, and insights.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-heading font-bold text-text-primary">AssessAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-bg-primary to-accent/5" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">AI-Powered Assessment Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-text-primary leading-tight">
              Build Smarter Assessments with{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Intelligence</span>
            </h1>
            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl">
              Create, manage, and analyze assessments with AI-powered question generation, real-time proctoring, and instant analytics. The modern platform for modern hiring.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-text-primary border border-border rounded-xl hover:bg-bg-tertiary transition-all duration-300">
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-heading font-bold text-primary">{value}</p>
              <p className="mt-1 text-sm text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-heading font-bold text-text-primary">Everything you need</h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">A complete assessment platform with tools for creation, delivery, proctoring, and analysis.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-xl border border-border bg-bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-heading font-bold text-text-primary">How it works</h2>
            <p className="mt-3 text-text-secondary">Get started in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4 relative">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-text-primary">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-10 md:p-14 text-center">
          <h2 className="text-3xl font-heading font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-primary-100 max-w-lg mx-auto">
            Join thousands of teams using AssessAI to build smarter, faster, and fairer assessments.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-primary bg-white rounded-xl hover:bg-white/90 transition-all duration-300">
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all duration-300">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading font-bold text-text-primary">AssessAI</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
            </div>
            <p className="text-xs text-text-tertiary">&copy; 2026 AssessAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
