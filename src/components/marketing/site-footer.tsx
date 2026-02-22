import type { NavigationItem } from "@/config/site";

type SiteFooterProps = {
  navigation: NavigationItem[];
};

export function SiteFooter({ navigation }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">Invessiv</p>
          <p className="site-footer__copy">
            Conversion-orientierte Landingpages und Webseiten mit klarer Struktur,
            performanter Umsetzung und messbarer Wirkung.
          </p>
        </div>

        <div>
          <p className="site-footer__heading">Navigation</p>
          <ul className="site-footer__list">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="site-footer__heading">Rechtliches</p>
          <ul className="site-footer__list">
            <li>
              <a href="/impressum">Impressum</a>
            </li>
            <li>
              <a href="/datenschutz">Datenschutz</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
