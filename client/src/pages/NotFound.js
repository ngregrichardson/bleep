import { Flex, Heading, Icon } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { FiFrown } from "react-icons/all";
import { useHistory } from "react-router-dom";

const NotFound = () => {
  const [redirectTime, setRedirectTime] = useState(5);
  const history = useHistory();

  let handleNavigateToHome = () => {
    history.push("/");
  };

  useEffect(() => {
    let interval = setInterval(() => {
      setRedirectTime((curr) => {
        if (curr <= 1) {
          handleNavigateToHome();
          return 0;
        } else {
          return curr - 1;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Icon
          as={FiFrown}
          boxSize={{ base: "60%", sm: "50%", md: "20%" }}
          color={"brand.400"}
        />
        <Heading size={"xl"} textAlign={"center"} paddingX={"15px"}>
          Oh f&%k, we couldn't find that. Don't worry though, we'll get you back
          on track in {redirectTime} seconds.
        </Heading>
      </Flex>
    </>
  );
};

export default NotFound;
