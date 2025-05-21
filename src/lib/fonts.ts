import localFont from 'next/font/local';

export const inter = localFont({
  display: 'swap',
  variable: '--font-inter', // Changed from --font-sans to avoid conflict if Geist is --font-sans
  src: [
    {
      path: '../../public/fonts/inter/inter_font_v18/inter-v18-latin-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/inter_font_v18/inter-v18-latin-italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/inter/inter_font_v18/inter-v18-latin-700.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/inter_font_v18/inter-v18-latin-700italic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
}); 