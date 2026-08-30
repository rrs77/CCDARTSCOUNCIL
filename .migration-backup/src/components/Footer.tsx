import React from 'react';
import { Youtube, Linkedin, Facebook, Twitter, Instagram, Music, Globe } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Music,
  other: Globe,
};

export function Footer() {
  const { settings } = useSettings();
  const b = settings.branding || {};
  const footerBg = b.footerBackgroundColor || '#128c7e';
  const contactEmail = b.footerContactEmail || 'info@rhythmstix.co.uk';
  const privacyUrl = b.footerPrivacyUrl || 'https://www.rhythmstix.co.uk/policy';
  const copyrightYear = b.footerCopyrightYear || '2026';
  const companyName = b.footerCompanyName || 'Rhythmstix';
  const showSocial = b.showSocialMedia !== false;
  // Use custom social links if set; otherwise fall back to legacy URLs
  const customLinks = b.footerSocialLinks?.filter(l => l.url?.trim());
  const legacyLinks = customLinks?.length
    ? []
    : [
        { platform: 'youtube' as const, url: b.footerYoutubeUrl || 'https://www.youtube.com/channel/UCooHhU7FKALUQ4CtqjDFMsw' },
        { platform: 'linkedin' as const, url: b.footerLinkedinUrl || 'https://www.linkedin.com/in/robert-reich-storer-974449144' },
        { platform: 'facebook' as const, url: b.footerFacebookUrl || 'https://www.facebook.com/Rhythmstix-Music-108327688309431' },
      ].filter(l => l.url);
  const socialLinks = (customLinks?.length ? customLinks : legacyLinks) as { platform: string; url: string }[];

  return (
    <footer className="fixed bottom-0 left-0 right-0 text-white py-3 z-50 shadow-lg" style={{ backgroundColor: footerBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          
          {/* Left side - Contact */}
          <div className="flex items-center space-x-4 text-base order-2 md:order-1">
            <a 
              href={`mailto:${contactEmail}`}
              className="text-white hover:text-blue-200 transition-colors duration-200 font-medium"
            >
              ✉️ Contact Us
            </a>
          </div>

          {/* Center - Social Media */}
          {showSocial && socialLinks.length > 0 && (
            <div className="flex items-center justify-center space-x-8 order-1 md:order-2">
              {socialLinks.map((link, i) => {
                const Icon = SOCIAL_ICONS[link.platform] || Globe;
                const label = link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
                return (
                  <a
                    key={i}
                    href={link.url}
                    className="text-white hover:text-blue-200 transition-colors duration-200 p-3 rounded-md"
                    style={{ backgroundColor: footerBg }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f7468'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = footerBg; }}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Right side - Copyright and Privacy */}
          <div className="flex items-center space-x-4 text-base order-3">
            <a 
              href={privacyUrl}
              className="text-white hover:text-blue-200 transition-colors duration-200 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            <span className="text-white">•</span>
            <span className="text-white font-medium">
              © <span style={{ letterSpacing: '0.05em' }}>{copyrightYear}</span> {companyName}
            </span>
          </div>
          
        </div>
      </div>
    </footer>
  );
}