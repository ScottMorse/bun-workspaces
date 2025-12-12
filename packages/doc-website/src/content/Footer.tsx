/** @todo Figure out how to set this in the theme/layout once using rspress v2  */
export const Footer = () => {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Smorsic Labs, LLC. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
