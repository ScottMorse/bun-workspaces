import { Link } from "rspress/theme";

const LINKS = {
  home: "/cli",
  globalOptions: "/cli/global-options",
  commands: "/cli/commands",
  examples: "/cli/examples",
} as const;

export interface CliHeaderProps {
  activeHref: keyof typeof LINKS;
}

export const CliHeader = ({ activeHref }: CliHeaderProps) => {
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
          href={LINKS.globalOptions}
          className={activeHref === "globalOptions" ? "active" : ""}
        >
          Global Options
        </Link>
        <Link
          href={LINKS.commands}
          className={activeHref === "commands" ? "active" : ""}
        >
          Commands
        </Link>
        {/*  // TODO enable when needed
        <Link
          href={LINKS.examples}
          className={activeHref === "examples" ? "active" : ""}
        >
          Examples
        </Link> */}
      </div>
      <p className="note" style={{ marginTop: "1rem" }}>
        Run the CLI via <code>bunx bun-workspaces</code> or alias it to{" "}
        <code>bw</code>, such as via <code>alias bw="bunx bun-workspaces"</code>
        , which can be placed in your shell configuration file, like{" "}
        <code>.bashrc</code>, <code>.zshrc</code>, or similar.
      </p>
      <p className="note" style={{ marginTop: "1rem" }}>
        Examples use an implied <code>bw</code> alias for brevity instead of{" "}
        <code>bunx bun-workspaces</code>.
      </p>
      <hr />
    </div>
  );
};
