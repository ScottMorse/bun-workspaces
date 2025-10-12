import path from "path";

const TEST_PROJECTS = {
  default: "fullProject",
  fullProject: "fullProject",
  emptyWorkspaces: "emptyWorkspaces",
  oneWorkspace: "oneWorkspace",
  invalidBadJson: "invalid/badJson",
  invalidNoName: "invalid/noName",
  invalidDuplicateName: "invalid/duplicateName",
  invalidBadTypeWorkspaces: "invalid/badTypeWorkspaces",
  badWorkspaceInvalidName: "invalid/badWorkspaceInvalidName",
  invalidBadTypeScripts: "invalid/badTypeScripts",
  invalidNoPackageJson: "invalid/noPackageJson",
  invalidBadWorkspaceGlobType: "invalid/badWorkspaceGlobType",
  invalidBadWorkspaceGlobOutsideRoot: "invalid/badWorkspaceGlobOutsideRoot",
  invalidAliasConflict: "invalid/aliasConflict",
  invalidAliasNotFound: "invalid/aliasNotFound",
};

type TestProject = keyof typeof TEST_PROJECTS;

export const getProjectRoot = (project: TestProject) =>
  path.join(__dirname, TEST_PROJECTS[project]);
