import { Link } from 'react-router-dom'
import { Brain, ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/shared'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg-card/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <BrandLogo className="text-lg" />
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-heading font-extrabold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-tertiary mb-10">Last updated: July 31, 2026</p>

        <div className="prose-dark space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-text-primary">Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong className="text-text-primary">Assessment Data:</strong> Responses, scores, and performance data from assessments you take or create.</li>
              <li><strong className="text-text-primary">Proctoring Data:</strong> Webcam images, tab-switch events, and audio data during proctored assessments (only when enabled).</li>
              <li><strong className="text-text-primary">Usage Data:</strong> Pages visited, features used, and interaction patterns within the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve our assessment platform.</li>
              <li>Generate AI-powered questions and analytics based on your usage.</li>
              <li>Process and score assessments accurately.</li>
              <li>Detect and prevent cheating or unauthorized behavior during proctored exams.</li>
              <li>Send important updates about your account or the platform.</li>
              <li>Ensure platform security and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-text-primary">AI Providers:</strong> Anonymized question data sent to AI services (Gemini, OpenAI) for question generation.</li>
              <li><strong className="text-text-primary">Cloud Infrastructure:</strong> Data stored on secure cloud providers (MongoDB Atlas, Render) for hosting.</li>
              <li><strong className="text-text-primary">Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption in transit (TLS) and at rest, secure authentication with JWT tokens, and regular security audits. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Assessment data may be retained in anonymized form for analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access, update, or delete your personal information.</li>
              <li>Export your assessment data in standard formats.</li>
              <li>Opt out of non-essential data collection.</li>
              <li>Withdraw consent for proctoring at any time (assessment may be terminated).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies. Refresh tokens are stored in httpOnly cookies for secure session handling.</p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-3">9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:ravipratap.gusknp2022@gmail.com" className="text-primary hover:underline">ravipratap.gusknp2022@gmail.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
