import Reveal from "@/components/Reveal";

type Props = {
  eyebrow: string;
  title: string;
  sub: string;
};

/** Gradient band header for inner pages. */
export default function PageHero({ eyebrow, title, sub }: Props) {
  return (
    <Reveal>
      <div className="page-hero">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="display">{title}</h1>
        <p>{sub}</p>
      </div>
    </Reveal>
  );
}
