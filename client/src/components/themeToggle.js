import { IconButton, useBreakpointValue, useColorMode } from "@chakra-ui/react";
import { FiMoon, FiSun } from "react-icons/all";

const ThemeToggle = () => {
  const { toggleColorMode, colorMode } = useColorMode();
  const iconSize = useBreakpointValue({ base: "20px", md: "25px" });

  return (
    <IconButton
      position={"fixed"}
      bottom={{ base: 15, md: 30 }}
      right={{ base: 15, md: 30 }}
      zIndex={1}
      aria-label={`Turn on ${colorMode === "light" ? "dark" : "light"} mode`}
      icon={
        colorMode === "light" ? (
          <FiMoon size={iconSize} />
        ) : (
          <FiSun size={iconSize} />
        )
      }
      onClick={toggleColorMode}
      boxSize={{ base: "50px", md: "60px" }}
    />
  );
};

export default ThemeToggle;
