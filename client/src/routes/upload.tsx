import React from "react";
import Stage from "./stage";
// @ts-ignore
import { Helmet } from "react-helmet";
// @ts-ignore
import { useMediaQuery } from "react-responsive";

function Upload() {
  const isTabletOrMobileDevice = useMediaQuery({
    query: "(max-device-width: 712px)",
  });
  return (
    <div>
      <Helmet>
        <title>Upload | Bleep</title>
      </Helmet>
      <div
        className="full-page-section"
        style={{
          height: isTabletOrMobileDevice ? window.innerHeight - 56 : "100vh",
        }}
      >
        <div
          className="center-form"
          style={{
            backgroundColor: isTabletOrMobileDevice ? "transparent" : undefined,
            width: isTabletOrMobileDevice ? "90vw" : undefined,
            height: isTabletOrMobileDevice ? "auto" : undefined,
          }}
        >
          <Stage />
        </div>
      </div>
    </div>
  );
}

export default Upload;
