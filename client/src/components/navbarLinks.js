import { Button, Link } from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router";

const NavbarLinks = (props) => {
  const history = useHistory();

  const handleNavigateToUpload = () => {
    history.push("/upload");
  };

  return (
    <>
      <Button
        as={Link}
        textDecoration={"none !important"}
        href={"/#usage"}
        variant={"ghost"}
        {...props}
      >
        How to use
      </Button>
      <Button
        variant={"ghost"}
        color={"brand.400"}
        onClick={handleNavigateToUpload}
        {...props}
      >
        Try it out
      </Button>
    </>
  );
};

export default NavbarLinks;
