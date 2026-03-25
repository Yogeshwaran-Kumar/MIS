/**
 * White-label configuration for ClubMIS.
 * All values are driven by environment variables so a new buyer
 * only needs to update their .env.local — no code changes needed.
 */
export const clubConfig = {
  /** Full display name of the club */
  name: process.env.NEXT_PUBLIC_CLUB_NAME || 'NDLI Club',

  /** Short name used in compact UI (sidebar, tab title) */
  shortName: process.env.NEXT_PUBLIC_CLUB_SHORT_NAME || 'NDLI',

  /** College / institution name shown in hero and footer */
  college: process.env.NEXT_PUBLIC_COLLEGE_NAME || 'Sri Sairam Engineering College',

  /** Path to the club logo (relative to /public) */
  logoPath: process.env.NEXT_PUBLIC_LOGO_PATH || '/ndli-logo-nbg.png',

  /** Email domain used as placeholder on the admin login form */
  adminEmailDomain:
    process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || 'srisairam.edu.in',

  /** Optional: support/contact email shown in the footer */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',

  /** Show or hide the "Powered by ClubMIS" branding banner (set to 'false' to hide for white-label) */
  showPoweredBy: process.env.NEXT_PUBLIC_SHOW_POWERED_BY !== 'false',
}
