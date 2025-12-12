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
        <div className="sub-header-links-title">Go To:</div>
        <a href={LINKS.home} className={activeHref === "home" ? "active" : ""}>
          Quick Start
        </a>
        <a
          href={LINKS.globalOptions}
          className={activeHref === "globalOptions" ? "active" : ""}
        >
          Global Options
        </a>
        <a
          href={LINKS.commands}
          className={activeHref === "commands" ? "active" : ""}
        >
          Commands
        </a>
        {/*  // TODO enable when needed
        <a
          href={LINKS.examples}
          className={activeHref === "examples" ? "active" : ""}
        >
          Examples
        </a> */}
      </div>
      <p className="note">
        Note: Examples use <code>bw</code> instead of{" "}
        <code>bunx bun-workspaces</code>, which works assuming you have either
        ran <code>alias bw="bunx bun-workspaces"</code> or placed this line in
        your shell configuration file, like <code>.bashrc</code>,{" "}
        <code>.zshrc</code>, or similar.
      </p>
      <hr />
    </div>
  );
};
