import { Header } from '@/components/leadup/header';
import { Hero } from '@/components/leadup/hero';
import { ProductMockup } from '@/components/leadup/product-mockup';
import { ProblemSection } from '@/components/leadup/problem-section';
import { ImpactPhrase } from '@/components/leadup/impact-phrase';
import { HowItWorks } from '@/components/leadup/how-it-works';
import { PipelineDemo } from '@/components/leadup/pipeline-demo';
import { MoneyDashboard } from '@/components/leadup/money-dashboard';
import { AIDemo } from '@/components/leadup/ai-demo';
import { Comparison } from '@/components/leadup/comparison';
import { Benefits } from '@/components/leadup/benefits';
import { Industries } from '@/components/leadup/industries';
import { EarlyAccess } from '@/components/leadup/early-access';
import { Pricing } from '@/components/leadup/pricing';
import { Calculator } from '@/components/leadup/calculator';
import { FAQ } from '@/components/leadup/faq';
import { FinalCTA } from '@/components/leadup/final-cta';
import { Footer } from '@/components/leadup/footer';
import { MobileCTA } from '@/components/leadup/mobile-cta';

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <ProductMockup />
      <ProblemSection />
      <ImpactPhrase />
      <HowItWorks />
      <PipelineDemo />
      <MoneyDashboard />
      <AIDemo />
      <Comparison />
      <Benefits />
      <Industries />
      <EarlyAccess />
      <Pricing />
      <Calculator />
      <FAQ />
      <FinalCTA />
      <Footer />
      <MobileCTA />
    </main>
  );
}
