import { useColorMode, useTheme } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Navbar from "./components/navbar";
import ThemeToggle from "./components/themeToggle";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Upload from "./pages/Upload";

const App = () => {
  const { colorMode } = useColorMode();
  const theme = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor =
      colorMode === "light"
        ? theme.colors.white["500"]
        : theme.colors.black["500"];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorMode]);

  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path={"/upload"}>
          <Upload />
        </Route>
        <Route exact path={"/"}>
          <Home />
        </Route>
        <Route path={"/*"}>
          <NotFound />
        </Route>
      </Switch>
      <ThemeToggle />
    </Router>
  );
};

export default App;
