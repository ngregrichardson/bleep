import React from "react";
import NavBar from "./components/NavBar";
import Home from "./routes/home";
// @ts-ignore
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import NotFound from "./routes/notFound";
import Upload from "./routes/upload";

function App() {
  return (
    <Router>
      <NavBar />
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
    </Router>
  );
}

export default App;
