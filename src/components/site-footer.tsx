import Link from 'next/link'

export function SiteFooter() {
  return <footer><div>
    <Link className="brand" href="/">وكيل<span>.AI</span></Link>
    <p>وكلاء أذكياء صُمموا لنمو الأعمال السعودية.</p>
  </div><div><strong>الدعم</strong><a href="tel:0509955337" dir="ltr">0509955337</a></div></footer>
}
