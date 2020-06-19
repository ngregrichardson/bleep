import React from "react";
// @ts-ignore
import ScrollableAnchor from "react-scrollable-anchor";
import { motion } from "framer-motion";
import IconLogo from "../assets/logo.svg";
// @ts-ignore
import { useHistory } from "react-router-dom";
import { Button, Icon, IconButton, Steps } from "rsuite";
// @ts-ignore
import { Helmet } from "react-helmet";
// @ts-ignore
import { useMediaQuery } from "react-responsive";

const bobLength = 10;

function Home() {
  const history = useHistory();
  const isTabletOrMobileDevice = useMediaQuery({
    query: "(max-device-width: 712px)",
  });

  let navigateToUpload = () => {
    history.push("/upload");
  };

  return (
    <div>
      <Helmet>
        <title>Home | Bleep</title>
      </Helmet>
      <div
        className="full-page-section"
        style={{
          height: isTabletOrMobileDevice ? window.innerHeight - 56 : "100vh",
        }}
      >
        <h1
          className="jumbotron-title"
          style={{ lineHeight: isTabletOrMobileDevice ? "150%" : "auto" }}
        >
          Stop That S%*t
        </h1>
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
          <img
            src={IconLogo}
            style={{ width: isTabletOrMobileDevice ? "50%" : "auto" }}
            className="jumbotron-icon"
            alt={"bleep-icon"}
          />
        </motion.div>
        {isTabletOrMobileDevice ? null : (
          <motion.div
            className="down-button"
            animate={{ y: [-bobLength, bobLength, -bobLength] }}
            transition={{
              ease: "easeInOut",
              duration: 3,
              loop: Infinity,
              times: [0, 0.5, 1],
            }}
          >
            <IconButton
              circle
              href="#about"
              appearance="subtle"
              size="lg"
              icon={<Icon icon={"angle-down"} size={"5x"} />}
            />
          </motion.div>
        )}
      </div>
      <div className="full-page-section">
        <ScrollableAnchor id="about">
          <h1 style={{ textAlign: "center" }}>
            About Bl<span className="primary-text-color">ee</span>p
          </h1>
        </ScrollableAnchor>
        <p
          className="paragraph-center margin-top-small"
          style={{
            fontSize: isTabletOrMobileDevice ? "100%" : "auto",
            width: isTabletOrMobileDevice ? "90%" : undefined,
          }}
        >
          I though of Bleep on my drive to school one day. I had been without a
          project for a few days and I was itching to start on a new one. I
          created the functionality over the next few weeks, but once summer
          started, I started working on other things and never finished the
          front end. A year later, as I was ending my first year of college, I
          decided to finish up some old projects: including Bleep. There are
          four simple steps to use Bleep.
        </p>
        <Steps className="about-steps" vertical={isTabletOrMobileDevice}>
          <Steps.Item
            icon={<Icon icon={"video-camera"} size={"2x"} />}
            title="Upload Your Video"
            description="This is where you upload your video file. The audio will be extracted from the video and searched for the selected words."
            status={"process"}
          />
          <Steps.Item
            icon={<Icon icon={"volume-up"} size={"2x"} />}
            title="Custom Sound Effect"
            description="You have the option to upload a custom sound file that will be used in place of any selected words. You can skip this step to use the default bleep."
            status={"process"}
          />
          <Steps.Item
            icon={<Icon icon={"ban"} size={"2x"} />}
            title="Blacklist Words"
            description="You can choose from our default list of common swear words and add or remove your own to customize it for your audience."
            status={"process"}
          />
          <Steps.Item
            icon={<Icon icon={"cloud-download"} size={"2x"} />}
            title="Download Your Video"
            description="The rest is on us! Once that progress bar hits 100% and you see a green checkmark, your file is ready to be downloaded."
            status={"process"}
          />
          {isTabletOrMobileDevice ? (
            <Button
              appearance="primary"
              className="margin-top-small"
              size={"lg"}
              style={{ width: "100%", marginBottom: 15 }}
              onClick={navigateToUpload}
            >
              Try it out!
            </Button>
          ) : null}
        </Steps>
        {isTabletOrMobileDevice ? null : (
          <Button
            appearance="primary"
            className="margin-top-small"
            size={"lg"}
            onClick={navigateToUpload}
          >
            Try it out!
          </Button>
        )}
      </div>
    </div>
  );
}

export default Home;
