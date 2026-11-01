// Analytics abstraction — swap implementation when ready

type AnalyticsEvent =
  | 'hero_cta_clicked'
  | 'pricing_cta_clicked'
  | 'whatsapp_clicked'
  | 'early_access_started'
  | 'early_access_completed'
  | 'calculator_used'
  | 'faq_opened'
  | 'mobile_cta_clicked';

export function trackEvent(event: AnalyticsEvent, data?: Record<string, any>) {
  // Replace with your analytics provider (GA4, Mixpanel, Plausible, etc.)
  if (typeof window !== 'undefined') {
    try {
      console.log(`[Analytics] ${event}`, data ?? {});
    } catch (_e) {
      // silently fail
    }
  }
}
