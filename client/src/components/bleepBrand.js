import { Heading, Flex } from "@chakra-ui/react";

const BleepBrand = (props) => (
  <Flex {...props}>
    <Heading display={"inline-block"}>Bl</Heading>
    <Heading color={"brand.400"} display={"inline-block"}>
      ee
    </Heading>
    <Heading display={"inline-block"}>p</Heading>
  </Flex>
);

export default BleepBrand;
