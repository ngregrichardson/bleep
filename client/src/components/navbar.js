import {
  Flex,
  Stack,
  useBreakpointValue,
  IconButton,
  useColorMode,
  useDisclosure,
  Collapse,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { FiMenu } from "react-icons/all";
import { useHistory } from "react-router";
import BleepBrand from "./bleepBrand";
import NavbarLinks from "./navbarLinks";

const Navbar = () => {
  const history = useHistory();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { colorMode } = useColorMode();

  const handleNavigateToHome = () => {
    history.push("/");
  };

  useEffect(() => {
    const listener = history.listen(() => onClose());
    return () => listener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex width={"100%"} direction={"column"} position={"fixed"} zIndex={1}>
      <Flex
        justifyContent={"space-between"}
        alignItems={"center"}
        padding={"20px"}
        backgroundColor={{
          base: colorMode === "light" ? "white.500" : "black.500",
          lg: "transparent",
        }}
      >
        <BleepBrand cursor={"pointer"} onClick={handleNavigateToHome} />
        {isMobile ? (
          <IconButton
            aria-label={"Menu"}
            icon={<FiMenu size={"25px"} />}
            size={"lg"}
            onClick={onToggle}
          />
        ) : (
          <Stack as={Flex} direction={"row"}>
            <NavbarLinks />
          </Stack>
        )}
      </Flex>
      {isMobile ? (
        <Collapse in={isOpen}>
          <Stack
            as={Flex}
            backgroundColor={colorMode === "light" ? "white.500" : "black.500"}
          >
            <NavbarLinks borderRadius={0} borderWidth={"0 !important"} />
          </Stack>
        </Collapse>
      ) : (
        (() => {
          if (isOpen) {
            onClose();
          }

          return null;
        })()
      )}
    </Flex>
  );
};

export default Navbar;
