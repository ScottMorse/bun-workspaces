import { type CliProjectCommandName } from "bun-workspaces/src/cli/projectCommands/projectCommandsConfig";
import { useId } from "react";
import { SyntaxHighlighter } from "../highlight";
import { getCliProjectCommandContent } from "./cliProjectCommandOptions";
import { getCommandId } from "./searchIds";

export const CliCommandDoc = ({
  command,
}: {
  command: CliProjectCommandName;
}) => {
  const content = getCliProjectCommandContent(command);
  const id = useId();
  return (
    <div className="cli-command-doc">
      <div id={getCommandId(content)} className="cli-doc-section-anchor" />
      <p>
        Usage: <code>{content.command}</code>
      </p>
      {content.aliases?.length ? (
        <p>
          Aliases:{" "}
          {content.aliases.map((value) => (
            <code
              key={id + "code-alias-" + value}
              style={{ marginRight: "0.25rem" }}
            >
              {value}
            </code>
          ))}
        </p>
      ) : (
        ""
      )}
      <p style={{ marginBottom: "0" }}>{content.description}</p>

      {Object.values(content.options)?.length ? (
        <div style={{ marginTop: "1rem" }}>
          <h5>
            <em>Options:</em>
          </h5>
          <div className="cli-command-options-container">
            {Object.values(content.options).map((option) => (
              <div
                key={
                  "cli-command-option-" +
                  content.command +
                  "-" +
                  option.flags.join(", ")
                }
              >
                <div className="cli-command-option-flags">
                  <p>
                    <code>{option.flags.join(" | ")}</code>
                  </p>
                  <p>{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        ""
      )}
      <h5>
        <em>Examples:</em>
      </h5>
      <SyntaxHighlighter language="bash">
        {content.examples.join("\n")}
      </SyntaxHighlighter>
    </div>
  );
};
