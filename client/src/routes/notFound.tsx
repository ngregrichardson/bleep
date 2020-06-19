import React from "react";
import { motion } from "framer-motion";
import IconLogo from "../assets/logo.svg";
// @ts-ignore
import { Helmet } from "react-helmet";

const bobLength = 10;

function NotFound() {
  return (
    <div>
      <Helmet>
        <title>Page Not Found | Bleep</title>
      </Helmet>
      <div className="full-page-section">
        <h1 className="jumbotron-title">F%*k, we couldn't find that</h1>
        <motion.div
          className="jumbotron-bob"
          animate={{ y: [-bobLength, bobLength, -bobLength] }}
          transition={{
            ease: "easeInOut",
            duration: 3,
            loop: Infinity,
            times: [0, 0.5, 1],
          }}
        >
          <img src={IconLogo} className="jumbotron-icon" alt={"bleep-icon"} />
        </motion.div>
      </div>
    </div>
  );
}

export default NotFound;
