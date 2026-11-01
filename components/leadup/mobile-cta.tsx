'use client';

import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/app';
import { trackEvent } from '@/lib/analytics';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/90 backdrop-blur-md border-t border-border/50 lg:hidden"
        >
          <a
            href={APP_CONFIG.SIGNUP_URL}
            onClick={() => trackEvent('mobile_cta_clicked')}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-md text-sm"
          >
            Testar grátis
            <ArrowRight size={16} />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
