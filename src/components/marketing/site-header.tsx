import Image from "next/image";
import type { NavigationItem } from "@/config/site";

type SiteHeaderProps = {
  navigation: NavigationItem[];
};

export function SiteHeader({ navigation }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#hero">
          <Image
            src="/brand/icon.svg"
            alt="Invessiv Logo"
            width={26}
            height={26}
            priority
          />
          <span>Invessiv</span>
        </a>

        <nav aria-label="Primary" className="site-header__desktop-nav">
          <ul className="site-header__nav">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <details className="site-header__mobile-menu">
          <summary>Menue</summary>
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </header>
  );
}
