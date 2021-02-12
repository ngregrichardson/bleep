import {
  Button,
  Flex,
  Heading,
  IconButton,
  Image,
  Stack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import React from "react";
import AnchorLink from "react-anchor-link-smooth-scroll";
import {
  FiChevronDown,
  FiDownloadCloud,
  FiSlash,
  FiUploadCloud,
  FiVolume2,
} from "react-icons/all";
import { useHistory } from "react-router-dom";
import logo from "../assets/logo.svg";
import ExampleStep from "../components/exampleStep";

const bobLength = 10;

const exampleSteps = [
  {
    title: "Upload Your Video",
    description:
      "This is where you upload your video file. The audio will be extracted from the video and searched for the selected words.",
    icon: FiUploadCloud,
  },
  {
    title: "Custom Sound Effect",
    description:
      "You have the option to upload a custom sound file that will be used in place of any selected words. You can skip this step to use the default bleep.",
    icon: FiVolume2,
  },
  {
    title: "Blacklist Words",
    description:
      "You can choose from our default list of common swear words and add or remove your own to customize it for your audience.",
    icon: FiSlash,
  },
  {
    title: "Download Your Video",
    description:
      "The rest is on us! Once that progress bar hits 100% and you see a green checkmark, your file is ready to be downloaded.",
    icon: FiDownloadCloud,
  },
];

const Home = () => {
  const history = useHistory();

  let handleNavigateToUpload = () => {
    history.push("/upload");
  };

  return (
    <>
      <Flex
        minHeight={"100vh"}
        width={"100vw"}
        alignItems={"center"}
        justifyContent={"center"}
        direction={"column"}
        position={"relative"}
      >
        <Heading size={"4xl"} textAlign={"center"} paddingX={"15px"}>
          Censor your S%*t
        </Heading>
        <Flex
          position={"absolute"}
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={-1}
          direction={"column"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <motion.div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            animate={{ y: [-bobLength, bobLength, -bobLength] }}
            transition={{
              ease: "easeInOut",
              duration: 3,
              loop: Infinity,
              times: [0, 0.5, 1],
            }}
          >
            <Image
              src={logo}
              width={{ base: "90%", sm: "75%", md: "60%" }}
              alt={"Bleep icon"}
            />
          </motion.div>
        </Flex>
        <IconButton
          as={AnchorLink}
          display={{ base: "none", md: "flex" }}
          position={"absolute"}
          bottom={30}
          isRound
          href={"#usage"}
          appearance={"ghost"}
          size="lg"
          icon={<FiChevronDown />}
        />
      </Flex>
      <Stack
        as={Flex}
        minHeight={"100vh"}
        width={"100vw"}
        alignItems={"center"}
        justifyContent={"center"}
        direction={"column"}
        position={"relative"}
        spacing={"30px"}
      >
        <Heading id={"usage"} textAlign={"center"}>
          How to use
        </Heading>
        <Stack
          as={Flex}
          direction={{ base: "column", md: "row" }}
          width={"90%"}
        >
          {exampleSteps.map((step) => (
            <ExampleStep {...step} />
          ))}
        </Stack>
        <Button
          onClick={handleNavigateToUpload}
          colorScheme={"brand"}
          size={"lg"}
        >
          Try it out
        </Button>
      </Stack>
    </>
  );
};

export default Home;
