import path from "path";

const TEST_PROJECTS = {
  default: "fullProject",
  fullProject: "fullProject",
  simple1: "simple1",
  simple2: "simple2",
  emptyWorkspaces: "emptyWorkspaces",
  oneWorkspace: "oneWorkspace",
  withNodeModuleWorkspace: "withNodeModuleWorkspace",
  negationGlobs: "negationGlobs",
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

export type TestProjectName = keyof typeof TEST_PROJECTS;

export const getProjectRoot = (testProjectName: TestProjectName) =>
  path.join(__dirname, TEST_PROJECTS[testProjectName]);
