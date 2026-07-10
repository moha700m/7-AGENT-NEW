import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: { default: 'وكيل.AI | سوق الوكلاء الأذكياء', template: '%s | وكيل.AI' },
  description: 'سوق سعودي آمن للوكلاء الأذكياء الجاهزين لخدمة الأعمال.',
  openGraph: { type: 'website', locale: 'ar_SA', siteName: 'وكيل.AI', title: 'وكيل.AI', description: 'وكلاء أذكياء جاهزون لنمو أعمالك.' },
  twitter: { card: 'summary_large_image', title: 'وكيل.AI', description: 'وكلاء أذكياء جاهزون لنمو أعمالك.' },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>
}
