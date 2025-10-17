import { useEffect, useState } from "react";

export const Bwunster = () => {
  const [isBlinked, setIsBlinked] = useState(false);

  useEffect(() => {
    let unmounted = false;
    (async () => {
      while (!unmounted) {
        await new Promise((resolve) =>
          setTimeout(
            () => {
              setIsBlinked(true);
              setTimeout(() => {
                setIsBlinked(false);
              }, 250);
              resolve(void 0);
            },
            Math.round(Math.random() * 7_000) + 5_000,
          ),
        );
      }
    })();
    return () => {
      unmounted = true;
    };
  }, []);

  return (
    <div className="home-logo-container">
      <img
        src="/bw-eye.png"
        alt="bun-workspaces"
        className="home-logo"
        width={100}
      />
      <img
        src="/bw-eye-blink.png"
        className="home-logo blink"
        width={100}
        style={isBlinked ? undefined : { display: "none" }}
      />
    </div>
  );
};
