import {
  CustomMatchResult,
  RenderType,
  type MatchResult,
  type OnSearch,
} from "rspress/theme";
import {
  getCliGlobalOptionsContent,
  getCliProjectCommandsContent,
} from "../content/cli";
import { getCommandId, getGlobalOptionId } from "../content/cli/searchIds";

const sanitize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\.-_0-9A-Za-z\/]/g, "");

const matches = (s: string, query: string) =>
  sanitize(s).includes(sanitize(query)) ||
  sanitize(query).includes(sanitize(s));

const onSearch: OnSearch = async (query, defaultResult) => {
  query = sanitize(query);

  for (const command of getCliProjectCommandsContent()) {
    if (
      matches(command.title, query) ||
      matches(command.description, query) ||
      matches(command.command, query) ||
      matches(command.optionName, query) ||
      Object.values(command.options).some(
        (option) =>
          matches(option.flag, query) || matches(option.description, query),
      )
    ) {
      defaultResult[0].result?.push({
        statement: "CLI Command: " + command.title,
        link: "/cli#" + getCommandId(command),
        type: "content",
        title: "CLI | Commands",
        header: "",
        query: "",
        highlightInfoList: [],
      });
    }
  }
  for (const globalOption of getCliGlobalOptionsContent()) {
    if (
      matches(globalOption.title as string, query) ||
      matches(globalOption.optionName, query) ||
      matches(globalOption.mainOption, query) ||
      matches(globalOption.shortOption, query) ||
      matches(globalOption.defaultValue, query) ||
      matches(globalOption.description, query)
    ) {
      defaultResult[0].result?.push({
        statement:
          "CLI Global Option: " +
          globalOption.title +
          " (" +
          globalOption.mainOption +
          " | " +
          globalOption.shortOption +
          ")",
        link: "/cli#" + getGlobalOptionId(globalOption),
        type: "content",
        title: "CLI | Global Options",
        header: "",
        query: "",
        highlightInfoList: [],
      });

      console.log({ defaultResult });
    }
  }
  return [];
};

export { onSearch };
