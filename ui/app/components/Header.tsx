import React from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components-preview/layouts";

export const Header = () => {
  return (
    (<AppHeader>
      <AppHeader.Navigation>
        <AppHeader.Logo as={Link} to="/" />
        {/* <AppHeader.NavItem as={Link} to="/chat">
          AI Chat
        </AppHeader.NavItem>
        <AppHeader.NavItem as={Link} to="/data">
          Explore Data
        </AppHeader.NavItem> */}
      </AppHeader.Navigation>
    </AppHeader>)
  );
};