const LINKS = {
  home: "/api",
  reference: "/api/reference",
  examples: "/api/examples",
} as const;

export interface ApiHeaderProps {
  activeHref: keyof typeof LINKS;
  divider?: boolean;
}

export const ApiHeader = ({ activeHref, divider }: ApiHeaderProps) => {
  return (
    <div className="sub-header">
      <div className="sub-header-links">
        <div className="sub-header-links-title">Go To:</div>
        <a href={LINKS.home} className={activeHref === "home" ? "active" : ""}>
          Quick Start
        </a>
        <a
          href={LINKS.reference}
          className={activeHref === "reference" ? "active" : ""}
        >
          Reference
        </a>
        {/* // TODO enable when needed
         <a
          href={LINKS.examples}
          className={activeHref === "examples" ? "active" : ""}
        >
          Examples
        </a> */}
      </div>
      <p className="note">
        Install the package via <code>bun add --dev bun-workspaces</code> to use
        the API.
      </p>
      {divider && <hr />}
    </div>
  );
};
