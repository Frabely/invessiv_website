type MarqueeSectionProps = {
  items: string[];
};

export function MarqueeSection({ items }: MarqueeSectionProps) {
  return (
    <section aria-label="Capability Marquee" className="marquee-section">
      <div className="marquee">
        <div className="marquee__track">
          {items.concat(items).map((item, index) => (
            <span className="marquee__item" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
