/* Everything starts here */
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.css";
import Routes from "./Routes";

ReactDOM.render(<Routes />, document.getElementById("root"));

serviceWorker.register();
