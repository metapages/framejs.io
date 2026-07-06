import React from "react";
import { HStack, Text, Icon } from "@chakra-ui/react";
import { X } from "@phosphor-icons/react";
import { useStore } from "/@/store";
import { PanelHeaderContainer } from "/@/components/common/PanelHeaderContainer";

interface PanelHeaderProps {
  title: string;
  onSave?: () => void;
  preserveCase?: boolean;
  children?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  children,
}) => {
  const setShownPanel = useStore((state) => state.setShownPanel);
  const titleText = title.toUpperCase();
  return (
    <PanelHeaderContainer>
      <HStack
        justify={"space-between"}
        pl="18px"
        pr={6}
        py={2}
        w={"100%"}
        h="100%"
      >
        <Text
          fontFamily="mono"
          fontSize="0.6875rem"
          fontWeight={500}
          letterSpacing="0.12em"
          color="gray.500"
        >
          {titleText}
        </Text>
        <HStack spacing={4} justify="center" flex="1" h="100%" align="center">
          {children}
        </HStack>
        <Icon
          boxSize="1rem"
          as={X}
          _hover={{ bg: "gray.300" }}
          borderRadius={4}
          onClick={() => setShownPanel(null)}
        />
      </HStack>
    </PanelHeaderContainer>
  );
};
