import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";

import App from "./components/app";

class Routes extends Component {
  render() {
    return (
      <Router>
        <div className="h-100">
          <Route exact path="/" render={props => <App />} />
        </div>
      </Router>
    );
  }
}

export default Routes;
