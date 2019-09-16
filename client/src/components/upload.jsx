import React, { Component } from "react";
import $ from "jquery";
import add from "../images/add.svg";
import remove from "../images/remove.svg";
import Pusher from "pusher-js";
import axios from "axios";

/**
 * This is the main application wrapper. Everything except for the login/signup pages is contained within this.
 */
class Upload extends Component {
  defaultSwears = [
    "fuck",
    "shit",
    "bitch",
    "bastard",
    "fucker",
    "hell",
    "damn",
    "dam",
    "dick",
    "dickhead",
    "ass",
    "asshole",
    "dumbass",
    "cunt",
    "kike",
    "pussy",
    "twat",
    "slut",
    "ho",
    "hoe",
    "douche",
    "douchebag"
  ];
  state = {
    swears: this.defaultSwears,
    inProgress: false,
    finished: false,
    message: "uploading...",
    progress: "5%",
    download: "",
    error: "",
    id: ""
  };
  handleSubmit = e => {
    e.preventDefault();
    let formData = new FormData($("#uploadForm")[0]);
    if (this.state.swears.length === 0) {
      this.setState({ swears: this.defaultSwears });
    }
    formData.append("swears", JSON.stringify(this.state.swears));
    $.ajax({
      type: "POST",
      enctype: "multipart/form-data",
      url: "/upload",
      data: formData,
      processData: false,
      contentType: false,
      cache: false,
      timeout: 600000,
      success: data => {
        if (data.status === "DONE") {
          this.setState({ finished: true });
        } else {
          console.log(data.error);
          this.setState({ error: data.errorMessage });
        }
      },
      error: data => {
        console.log(data);
      }
    });
  };

  handleOpen = id => {
    $(`#${id}`).click();
  };

  handleAddSwear = () => {
    let { swears } = this.state;
    let swear = $("#addSwear").val();
    if (swear === "" || /^[ \t\r\n\s]*$/.test(swear)) {
      window.alert(`You can't censor a blank word!`);
      $("#addSwear").val("");
      return;
    }
    if (swears.includes(swear)) {
      window.alert(`You are already censoring ${swear}!`);
      $("#addSwear").val("");
      return;
    }
    swears.push(swear);
    $("#addSwear").val("");
    this.setState({ swears });
  };

  handleRemoveSwear = swear => {
    if (window.confirm(`Are you sure you want to remove ${swear}?`)) {
      let { swears } = this.state;
      swears.splice(swears.indexOf(swear), 1);
      this.setState({ swears });
    }
  };

  handleClearSwears = swear => {
    if (window.confirm(`Are you sure you want to remove all swears?`)) {
      this.setState({ swears: [] });
    }
  };

  handleKeyPress = keyEvent => {
    var keyCode = keyEvent.keyCode || keyEvent.which;
    if (keyCode === 13) {
      this.handleAddSwear();
    }
  };

  handleDownload = () => {
    axios({
      url: `${window.location.href}download\\${this.state.id}`,
      method: "GET",
      responseType: "blob"
    }).then(res => {
      console.log(res);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "output.mp4");
      document.body.appendChild(link);
      link.click();
    });
  };

  componentWillMount = () => {
    let pusher = new Pusher("9477cf297ad61024ec6a", {
      cluster: "us2",
      forceTLS: true
    });
    var channel = pusher.subscribe("progress");
    let upload = this;
    channel.bind("update", function(data) {
      upload.setState({
        message: data.message,
        progress: data.progress,
        inProgress: true,
        finished: data.finished,
        id: data.id
      });
    });
  };

  render() {
    if (!this.state.inProgress) {
      return (
        <div className="h-100 content">
          <form
            encType="multipart/form-data"
            id="uploadForm"
            style={{ display: "none" }}
          >
            <input id="sfx" type="file" accept=".mp3" name="sfx"></input>
            <input id="video" type="file" accept="video/*" name="video"></input>
          </form>
          <div
            className="container"
            style={{
              borderTopLeftRadius: "10px",
              borderBottomLeftRadius: "10px"
            }}
          >
            <div style={{ maxHeight: "100%" }}>
              <div className="container-header">Select your swears</div>
              <div className="container-body">
                <div className="list-container">
                  <div className="inl-form">
                    <input
                      id="addSwear"
                      type="text"
                      placeholder="Add swears..."
                      onKeyPress={this.handleKeyPress}
                      title="Add swear"
                    ></input>
                    <button onClick={this.handleAddSwear} title="Add swear">
                      <img src={add} alt="add swear"></img>
                    </button>
                    <button
                      onClick={this.handleClearSwears}
                      title="Clear swears"
                    >
                      <img src={remove} alt="clear swears"></img>
                    </button>
                  </div>
                  <div className="list-items">
                    {this.state.swears.map((item, i) => {
                      return (
                        <li key={item}>
                          <span>{item}</span>
                          <img
                            src={remove}
                            onClick={() => {
                              this.handleRemoveSwear(item);
                            }}
                            title={`Remove ${item}`}
                            alt={`remove ${item}`}
                          ></img>
                        </li>
                      );
                    })}
                  </div>
                  <span className="button-link" style={{ margin: "5px 0px" }}>
                    or leave blank to use the default swears
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="container">
            <div className="container-header">Upload custom SFX</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
            >
              <button
                className="button-lg"
                onClick={() => {
                  this.handleOpen("sfx");
                }}
              >
                Upload Audio...
              </button>
              <span className="button-link">
                or skip to use the default beep
              </span>
            </div>
          </div>
          <div className="container">
            <div className="container-header">Upload video</div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
            >
              <button
                className="button-lg"
                onClick={() => {
                  this.handleOpen("video");
                }}
              >
                Upload Video...
              </button>
            </div>
          </div>
          <div
            className="container"
            style={{
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "10px"
            }}
          >
            <div className="container-header">Start!</div>
            <button className="button-lg" onClick={this.handleSubmit}>
              Start!
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-100 content">
          <div
            className="container"
            style={{
              borderTopLeftRadius: "10px",
              borderBottomLeftRadius: "10px"
            }}
          >
            <div
              id="progressBar"
              style={{ display: this.state.finished ? "none" : "flex" }}
            >
              <div
                id="progressBar-inner"
                style={{ width: this.state.progress }}
              >
                {this.state.progress}
              </div>
            </div>
            <div
              style={{
                display: !this.state.finished ? "none" : "flex",
                flexDirection: "column",
                justifyContent: "center"
              }}
            >
              <video
                src={this.state.download}
                style={{
                  marginBottom: "10px",
                  display:
                    this.state.download === undefined ||
                    this.state.download === ""
                      ? "none"
                      : "block"
                }}
                controls
              ></video>
              <button
                className="button-lg"
                onClick={() => {
                  this.handleDownload();
                }}
              >
                Download Censored Video
              </button>
            </div>
            <span
              id="progressMessage"
              style={{
                display: this.state.finished ? "none" : "flex",
                color:
                  this.state.error !== undefined && this.state.error !== ""
                    ? "red"
                    : "white"
              }}
            >
              {this.state.error !== undefined && this.state.error !== ""
                ? this.state.error
                : this.state.message}
            </span>
          </div>
        </div>
      );
    }
  }
}

export default Upload;
