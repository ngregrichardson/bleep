import { extendTheme } from "@chakra-ui/react";

const theme = {
  colors: {
    black: {
      50: "#737373",
      100: "#595959",
      200: "#404040",
      300: "#262626",
      400: "#0d0d0d",
      500: "#000000",
      600: "#000000",
      700: "#000000",
      800: "#000000",
      900: "#000000",
    },
    white: {
      50: "#f2f2f2",
      100: "#d9d9d9",
      200: "#bfbfbf",
      300: "#a6a6a6",
      400: "#8c8c8c",
      500: "#ffffff",
      600: "#ffffff",
      700: "#ffffff",
      800: "#ffffff",
      900: "#ffffff",
    },
    brand: {
      50: "#dffef0",
      100: "#b9f3d9",
      200: "#92eac1",
      300: "#69e1aa",
      400: "#40d892",
      500: "#27bf78",
      600: "#1a945c",
      700: "#0f6a42",
      800: "#024126",
      900: "#001708",
    },
  },
};

export default extendTheme(theme);
