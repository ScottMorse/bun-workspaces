import { Fragment, useId } from "react";

const BRAGS = [
  "Uses minimal dependencies",
  "We believe in thorough tests and docs",
  "No setup required",
  "Run workspace scripts in series or parallel",
  "Set aliases for workspaces",
  "Output script results to a JSON file",
  "JS API available",
  "TypeScript friendly",
  "Intellisense Support",
  "New features always on the way",
  "We listen to our users",
  "Configurable logging",
];

export const BragTicker = () => {
  const id = useId();
  return (
    <div className="brag-ticker-container">
      <div className="brag-ticker">
        {BRAGS.map((brag, i) => (
          <Fragment key={id + brag + i}>
            <div className="brag-ticker-item dot">●</div>
            <div className="brag-ticker-item">{brag}</div>
          </Fragment>
        ))}
        {BRAGS.map((brag, i) => (
          <Fragment key={id + brag + i + "-2"}>
            <div className="brag-ticker-item dot">●</div>
            <div className="brag-ticker-item">{brag}</div>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
