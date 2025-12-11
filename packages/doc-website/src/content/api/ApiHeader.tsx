const LINKS = {
  home: "/api",
  utilities: "/api/utilities",
  examples: "/api/examples",
} as const;

export interface ApiHeaderProps {
  activeHref: keyof typeof LINKS;
  divider?: boolean;
}

export const ApiHeader = ({ activeHref, divider }: ApiHeaderProps) => {
  const activeLink = LINKS[activeHref];
  return (
    <div className="sub-header">
      <div className="sub-header-links">
        <div>Go To:</div>
        <a href={LINKS.home} className={activeHref === "home" ? "active" : ""}>
          Quick Start
        </a>
        <a
          href={LINKS.utilities}
          className={activeHref === "utilities" ? "active" : ""}
        >
          Utilities
        </a>
        <a
          href={LINKS.examples}
          className={activeHref === "examples" ? "active" : ""}
        >
          Examples
        </a>
      </div>
      <p className="note">
        Install the package via <code>bun add --dev bun-workspaces</code> to use
        the API.
      </p>
      {divider && <hr />}
    </div>
  );
};
