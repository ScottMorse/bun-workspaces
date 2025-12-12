const LINKS = {
  workspaceAliases: "/concepts/workspace-aliases",
  scriptRuntimeMetadata: "/concepts/script-runtime-metadata",
  scriptExecutionOrder: "/concepts/script-execution-order",
} as const;

export interface ConceptsHeaderProps {
  activeHref: keyof typeof LINKS | "home";
  divider?: boolean;
}

export const ConceptsHeader = ({
  activeHref,
  divider,
}: ConceptsHeaderProps) => {
  return (
    <div className="sub-header">
      <div className="sub-header-links">
        <div className="sub-header-links-title">Go To:</div>
        <a
          href={LINKS.workspaceAliases}
          className={activeHref === "workspaceAliases" ? "active" : ""}
        >
          Workspace Aliases
        </a>
        <a
          href={LINKS.scriptRuntimeMetadata}
          className={activeHref === "scriptRuntimeMetadata" ? "active" : ""}
        >
          Script Runtime Metadata
        </a>
        <a
          href={LINKS.scriptExecutionOrder}
          className={activeHref === "scriptExecutionOrder" ? "active" : ""}
        >
          Script Execution Order
        </a>
      </div>
      {divider && <hr />}
    </div>
  );
};
