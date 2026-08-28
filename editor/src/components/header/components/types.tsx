import React from "react";

import { Icon, MenuItem } from "@chakra-ui/react";

/**
 * Header buttons render in two places: as a bare icon in the header row, and as
 * a labelled row inside the overflow menu shown when the header is too narrow
 * to fit the icon row.
 */
export type HeaderButtonProps = {
  iconSize?: string;
  iconPadding?: string;
  variant?: "icon" | "menuitem";
};

export const HeaderMenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isDisabled?: boolean;
  testId?: string;
}> = ({ icon, label, onClick, isDisabled, testId }) => (
  <MenuItem
    icon={<Icon as={icon} boxSize={"20px"} />}
    onClick={onClick}
    isDisabled={isDisabled}
    data-testid={testId}
    fontSize={"sm"}
  >
    {label}
  </MenuItem>
);
