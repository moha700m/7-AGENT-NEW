import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = { title: { default: 'وكيل.AI | سوق الوكلاء الأذكياء', template: '%s | وكيل.AI' }, description: 'سوق سعودي آمن للوكلاء الذكيين للأعمال.', openGraph: { type: 'website', locale: 'ar_SA', siteName: 'وكيل.AI' }, twitter: { card: 'summary_large_image' } }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body>{children}</body></html> }
