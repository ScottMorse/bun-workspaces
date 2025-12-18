import { Link } from "rspress/theme";

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
        <Link
          href={LINKS.home}
          className={activeHref === "home" ? "active" : ""}
        >
          Quick Start
        </Link>
        <Link
          href={LINKS.reference}
          className={activeHref === "reference" ? "active" : ""}
        >
          Reference
        </Link>
        {/* // TODO enable when needed
         <Link
          href={LINKS.examples}
          className={activeHref === "examples" ? "active" : ""}
        >
          Examples
        </Link> */}
      </div>
      <p className="note" style={{ marginTop: "1rem" }}>
        Install the package via <code>bun add --dev bun-workspaces</code> to use
        the API.
      </p>
      {divider && <hr />}
    </div>
  );
};
