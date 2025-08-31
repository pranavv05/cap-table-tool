import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  BarChart3,
  Shield,
  Users,
  Star,
  TrendingUp,
  Zap,
  Globe,
  CheckCircle,
  Play,
  Sparkles,
  Target,
  Award,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { AuthButton } from "@/components/auth-button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="glass-effect sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BarChart3 className="h-8 w-8 text-primary animate-glow" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <span className="font-bold text-xl gradient-text">CapTable Pro</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Pricing
              </Link>
              <Link
                href="#testimonials"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Reviews
              </Link>
              <Link
                href="#resources"
                className="text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                Resources
              </Link>
            </nav>
            <AuthButton />
          </div>
        </div>
      </header>

      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-slide-in-up">
              <div className="space-y-6">
                <Badge
                  variant="secondary"
                  className="w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Trusted by 2,500+ Startups Worldwide
                </Badge>

                <h1 className="text-5xl lg:text-7xl font-bold text-foreground text-balance leading-tight">
                  Master Your <span className="gradient-text">Equity Story</span>
                </h1>

                <p className="text-xl lg:text-2xl text-muted-foreground text-pretty max-w-2xl leading-relaxed">
                  The most sophisticated cap table platform for ambitious founders and discerning investors. Model
                  scenarios, track dilution, and make confident equity decisions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-4 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link href="/sign-up">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-105 bg-transparent"
                  asChild
                >
                  <Link href="/demo">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-6">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">4.9/5</span>
                </div>
                <div className="text-sm text-muted-foreground">500+ reviews</div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">SOC 2 Compliant</span>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-700">
                <img
                  src="/modern-cap-table-dashboard-interface-with-charts-a.png"
                  alt="Advanced Cap Table Dashboard"
                  className="w-full h-auto rounded-2xl shadow-2xl border border-border/50"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-2xl"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl -z-10 transform scale-110 animate-glow"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-20"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="space-y-8 max-w-4xl mx-auto">
            <Badge
              variant="secondary"
              className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Join 2,500+ Companies
            </Badge>

            <h2 className="text-4xl lg:text-6xl font-bold text-balance">Ready to Master Your Equity Story?</h2>

            <p className="text-xl lg:text-2xl text-primary-foreground/90 text-pretty max-w-3xl mx-auto leading-relaxed">
              Join thousands of founders and investors who trust CapTable Pro for their most important equity decisions.
              Start your free trial today—no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-4 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-foreground" />
                <span className="text-primary-foreground/90">14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-foreground" />
                <span className="text-primary-foreground/90">No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-foreground" />
                <span className="text-primary-foreground/90">Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-muted/30 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline" className="mb-4">
              <Target className="w-3 h-3 mr-1" />
              Platform Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground text-balance">
              Everything You Need to <span className="gradient-text">Scale Confidently</span>
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
              From seed to IPO, our platform grows with you. Advanced modeling, real-time collaboration, and
              institutional-grade security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:border-primary/20 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Advanced Scenario Modeling</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Model complex funding rounds, SAFE conversions, and exit scenarios with institutional-grade accuracy.
                  Visualize dilution impact across multiple rounds.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:border-primary/20 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <Users className="h-7 w-7 text-accent" />
                </div>
                <CardTitle className="text-xl font-bold">Real-time Collaboration</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Seamlessly collaborate with co-founders, investors, and legal counsel. Share scenarios, track changes,
                  and maintain a single source of truth.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:border-primary/20 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-chart-1/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-chart-1/20 transition-colors">
                  <BarChart3 className="h-7 w-7 text-chart-1" />
                </div>
                <CardTitle className="text-xl font-bold">Interactive Visualizations</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Beautiful charts and graphs that make complex equity structures easy to understand. Export
                  presentation-ready materials for board meetings.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:border-primary/20 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-chart-2/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-chart-2/20 transition-colors">
                  <Shield className="h-7 w-7 text-chart-2" />
                </div>
                <CardTitle className="text-xl font-bold">Enterprise Security</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  SOC 2 Type II compliant with bank-level encryption. Role-based access controls and comprehensive audit
                  trails for regulatory compliance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:border-primary/20 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-chart-3/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-chart-3/20 transition-colors">
                  <Zap className="h-7 w-7 text-chart-3" />
                </div>
                <CardTitle className="text-xl font-bold">AI-Powered Insights</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Get intelligent recommendations on option pool sizing, valuation benchmarks, and optimal funding
                  strategies powered by market data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 hover:border-primary/20 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-chart-4/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-chart-4/20 transition-colors">
                  <Globe className="h-7 w-7 text-chart-4" />
                </div>
                <CardTitle className="text-xl font-bold">Global Compliance</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Support for international equity structures, multi-currency modeling, and compliance with regulations
                  across 50+ countries.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline">
              <Star className="w-3 h-3 mr-1" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground text-balance">
              Trusted by <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              From unicorn startups to Fortune 500 companies, see why thousands choose CapTable Pro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="pt-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    "CapTable Pro transformed our Series A preparation. The scenario modeling helped us negotiate better
                    terms and the audit trail gave our lawyers confidence in our data."
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">SJ</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">CEO, TechStart Inc. • $50M Series A</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-chart-1"></div>
              <CardContent className="pt-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    "As a VC, I use CapTable Pro to analyze portfolio companies. The real-time collaboration and
                    detailed reporting save hours of due diligence work."
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-accent">MC</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Michael Chen</p>
                      <p className="text-sm text-muted-foreground">Partner, Venture Capital • $500M AUM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-chart-1 to-primary"></div>
              <CardContent className="pt-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    "The AI insights helped us optimize our option pool before our IPO. We saved 2% dilution compared to
                    our initial plan. Incredible value for public company preparation."
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-chart-1">AR</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Alex Rodriguez</p>
                      <p className="text-sm text-muted-foreground">CFO, InnovateCorp • IPO 2024</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="resources" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              Resources
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">
              Master Equity <span className="gradient-text">Management</span>
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Expert insights, guides, and tools to help you navigate complex equity decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 group cursor-pointer">
              <CardHeader>
                <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mb-4 flex items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl">Cap Table Modeling Guide</CardTitle>
                <CardDescription>
                  Complete guide to building accurate cap tables and modeling complex scenarios.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 group cursor-pointer">
              <CardHeader>
                <div className="w-full h-48 bg-gradient-to-br from-accent/10 to-chart-1/10 rounded-lg mb-4 flex items-center justify-center">
                  <TrendingUp className="h-16 w-16 text-accent group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl">Fundraising Playbook</CardTitle>
                <CardDescription>
                  Strategic insights on valuation, dilution, and negotiating with investors.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card hover:shadow-xl transition-all duration-500 hover:scale-105 group cursor-pointer">
              <CardHeader>
                <div className="w-full h-48 bg-gradient-to-br from-chart-1/10 to-primary/10 rounded-lg mb-4 flex items-center justify-center">
                  <Shield className="h-16 w-16 text-chart-1 group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl">Compliance Checklist</CardTitle>
                <CardDescription>
                  Essential compliance requirements for equity management and regulatory reporting.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                </div>
                <span className="font-bold text-xl gradient-text">CapTable Pro</span>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                The most sophisticated cap table platform for ambitious founders and discerning investors. Trusted by
                2,500+ companies worldwide.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.9/5 from 500+ reviews</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-lg">Product</h4>
              <div className="space-y-3 text-sm">
                <Link href="/features" className="block text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="block text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
                <Link href="/demo" className="block text-muted-foreground hover:text-primary transition-colors">
                  Demo
                </Link>
                <Link href="/integrations" className="block text-muted-foreground hover:text-primary transition-colors">
                  Integrations
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-lg">Resources</h4>
              <div className="space-y-3 text-sm">
                <Link href="/guides" className="block text-muted-foreground hover:text-primary transition-colors">
                  Guides
                </Link>
                <Link href="/blog" className="block text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
                <Link href="/webinars" className="block text-muted-foreground hover:text-primary transition-colors">
                  Webinars
                </Link>
                <Link href="/support" className="block text-muted-foreground hover:text-primary transition-colors">
                  Support
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-lg">Company</h4>
              <div className="space-y-3 text-sm">
                <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
                <Link href="/careers" className="block text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
                <Link href="/partners" className="block text-muted-foreground hover:text-primary transition-colors">
                  Partners
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">© 2024 CapTable Pro. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="text-muted-foreground hover:text-primary transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
