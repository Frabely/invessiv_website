type PlaceholderSectionProps = {
  description: string;
  id: string;
  isTall?: boolean;
  title: string;
};

export function PlaceholderSection({
  description,
  id,
  isTall = false,
  title,
}: PlaceholderSectionProps) {
  return (
    <section
      className={`content-section ${isTall ? "content-section--tall" : ""}`}
      id={id}
    >
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
