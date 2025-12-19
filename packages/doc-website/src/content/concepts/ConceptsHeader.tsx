import { Link } from "rspress/theme";
const LINKS = {
  glossary: "/concepts/glossary",
  workspaceAliases: "/concepts/workspace-aliases",
  parallelScripts: "/concepts/parallel-scripts",
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
        <Link
          href={LINKS.glossary}
          className={activeHref === "glossary" ? "active" : ""}
        >
          Glossary
        </Link>
        <Link
          href={LINKS.workspaceAliases}
          className={activeHref === "workspaceAliases" ? "active" : ""}
        >
          Workspace Aliases
        </Link>
        <Link
          href={LINKS.parallelScripts}
          className={activeHref === "parallelScripts" ? "active" : ""}
        >
          Parallel Scripts
        </Link>
        <Link
          href={LINKS.scriptRuntimeMetadata}
          className={activeHref === "scriptRuntimeMetadata" ? "active" : ""}
        >
          Script Runtime Metadata
        </Link>
        <Link
          href={LINKS.scriptExecutionOrder}
          className={activeHref === "scriptExecutionOrder" ? "active" : ""}
        >
          Script Execution Order
        </Link>
      </div>
      {divider && <hr />}
    </div>
  );
};
