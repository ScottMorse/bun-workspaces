import { useEffect, useRef } from "react";
import { Link } from "rspress/theme";
import Theme from "rspress/theme";

/** @todo The href-related code is all a pretty terrible hack to get around "/index" being forced as the home link. */
const HomeLink = () => {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("href", "/");
    }
  }, []);

  return (
    <Link href="/." ref={ref}>
      <div className="nav-title-container">
        <img
          src="/bw-eye-square.png"
          alt="bun-workspaces"
          width={24}
          height={24}
        />
        bun-workspaces
      </div>
    </Link>
  );
};

const Layout = () => <Theme.Layout navTitle={<HomeLink />} />;

export default {
  ...Theme,
  Layout,
};

export * from "rspress/theme";

console.log("bun-workspaces Documentation:", process.env.BUILD_ID);
