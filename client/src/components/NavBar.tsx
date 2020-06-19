import React, { useState } from "react";
// @ts-ignore
import { goToAnchor } from "react-scrollable-anchor";
// @ts-ignore
import { useHistory, useLocation } from "react-router-dom";
import { Icon, Nav, Navbar } from "rsuite";
// @ts-ignore
import { useMediaQuery } from "react-responsive";

function NavBar() {
  const history = useHistory();
  const location = useLocation();
  const isTabletOrMobileDevice = useMediaQuery({
    query: "(max-device-width: 712px)",
  });
  const [open, setOpen] = useState(false);

  let handleBrandClick = () => {
    if (location.pathname === "/") {
      goToAnchor("top");
    } else {
      history.push("/");
    }
  };

  let handleAboutClick = () => {
    if (location.pathname === "/") {
      goToAnchor("about");
    } else {
      history.push("/#about");
    }
    setOpen(false);
  };

  let navigateToUpload = () => {
    history.push("/upload");
    setOpen(false);
  };

  let navigateToHome = () => {
    history.push("/");
    setOpen(false);
  };

  return (
    <Navbar
      appearance={"subtle"}
      className={isTabletOrMobileDevice ? "navbar-mobile" : "navbar"}
    >
      <Navbar.Header>
        <h4 className="navbar-brand" onClick={handleBrandClick}>
          Bl<span className="primary-text-color">ee</span>p
        </h4>
      </Navbar.Header>
      {isTabletOrMobileDevice ? (
        <Navbar.Body>
          <Nav pullRight>
            <Nav.Item onClick={() => setOpen(!open)}>
              <Icon
                icon={"bars"}
                style={{ marginTop: -5, marginRight: -5, width: 28 }}
                size={"2x"}
              />
            </Nav.Item>
          </Nav>
        </Navbar.Body>
      ) : null}
      {(!isTabletOrMobileDevice || open) && (
        <Navbar.Body>
          <Nav pullRight>
            {location.pathname === "/" ? null : (
              <Nav.Item onClick={navigateToHome}>Home</Nav.Item>
            )}
            <Nav.Item onClick={handleAboutClick}>About</Nav.Item>
            <Nav.Item onClick={navigateToUpload}>Upload</Nav.Item>
            <Nav.Item
              href={"https://github.com/ngregrichardson/Bleep"}
              target={"_blank"}
              icon={<Icon icon="github" />}
            >
              GitHub
            </Nav.Item>
          </Nav>
        </Navbar.Body>
      )}
    </Navbar>
  );
}

export default NavBar;
