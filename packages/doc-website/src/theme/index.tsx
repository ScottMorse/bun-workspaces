import Theme from "rspress/theme";

const Layout = () => <Theme.Layout />;

export * from "rspress/theme";

export default {
  ...Theme,
  Layout,
};
