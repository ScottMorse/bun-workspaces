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
  const activeLink = LINKS[activeHref];
  return (
    <div className="sub-header">
      <div className="sub-header-links">
        <div>Go To:</div>
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
        <a
          href={LINKS.examples}
          className={activeHref === "examples" ? "active" : ""}
        >
          Examples
        </a>
      </div>
      <div className="note">
        Note: Examples use `bw` instead of `bunx bun-workspaces`, which works
        assuming you have either ran `alias bw="bunx bun-workspaces"` or placed
        it in your shell configuration file.
      </div>
      <hr />
    </div>
  );
};
