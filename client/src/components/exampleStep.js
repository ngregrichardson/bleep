import { Flex, Heading, Text, Stack, Icon } from "@chakra-ui/react";
import React from "react";

const ExampleStep = ({ title, icon, description }) => (
  <Stack
    as={Flex}
    borderWidth={"1px"}
    borderRadius={"lg"}
    padding={"20px"}
    direction={"column"}
    flex={1}
  >
    <Flex alignItems={"center"}>
      <Icon
        as={icon}
        color={"brand.400"}
        marginRight={"10px"}
        boxSize={"25px"}
      />
      <Heading size={"md"}>{title}</Heading>
    </Flex>
    <Text>{description}</Text>
  </Stack>
);

export default ExampleStep;
