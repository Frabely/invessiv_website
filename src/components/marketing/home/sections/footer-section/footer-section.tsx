import type { LandingSectionCopy } from "@/content/landing/home";

type FooterColumn = NonNullable<LandingSectionCopy["footerColumns"]>[number];

type FooterSectionProps = {
  bottomNote?: string;
  columns: FooterColumn[];
  description: string;
  id: string;
};

export function FooterSection({
  bottomNote,
  columns,
  description,
  id,
}: FooterSectionProps) {
  return (
    <footer className="site-footer" id={id}>
      <p className="site-footer__hint">{description}</p>

      <div className="site-footer__grid" role="list">
        {columns.map((column) => (
          <section className="site-footer__col" key={column.title} role="listitem">
            <h3>{column.title}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {bottomNote ? <p className="site-footer__bottom">{bottomNote}</p> : null}
    </footer>
  );
}
