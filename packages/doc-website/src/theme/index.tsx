import { useEffect, useRef } from "react";
import { Link } from "rspress/theme";
import packageJson from "../../../bun-workspaces/package.json";
import Theme from "rspress/theme";
import { PixelArtImage } from "../util/pixelArt";

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
        <PixelArtImage
          path="/images/png/bwunster_64x70.png"
          style={{
            width: "1.6rem",
          }}
          small
          height="auto"
        />
        <div className="nav-title-text-container">
          <div className="nav-title-text-container-inner">
            <PixelArtImage
              path="/images/png/bw-title--dark_99x10.png"
              style={{
                width: "7.5rem",
              }}
              height="auto"
              className="dark-only nav-title-text"
              alt="bun-workspaces"
            />
            <PixelArtImage
              path="/images/png/bw-title--light_99x10.png"
              style={{
                width: "7.5rem",
              }}
              height="auto"
              className="light-only nav-title-text"
              alt="bun-workspaces"
            />
          </div>
          <div className="nav-title-version">{packageJson.version}</div>
        </div>
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
