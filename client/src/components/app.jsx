import React, { Component } from "react";
import Upload from "./upload";

/**
 * This is the main application wrapper. Everything except for the login/signup pages is contained within this.
 */
class App extends Component {
  handleSubmit = e => {
    e.preventDefault();
    document.getElementById("uploadForm").submit();
  };

  render() {
    return <Upload></Upload>;
  }
}

export default App;
