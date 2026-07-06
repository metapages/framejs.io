import { useCallback } from "react";

import { Center, HStack, Text, VStack } from "@chakra-ui/react";
import { useHashParamJson } from "@metapages/hash-query/react-hooks";

import { AddInputButtonAndModal, DataRef } from "./AddInputButtonAndModal";
import { InputRow } from "./InputRow";

export type { DataRef };

export type InputsHashParam = {
  [key: string]: DataRef;
};

export const SectionInputs: React.FC = () => {
  const [inputs, setInputs] = useHashParamJson<InputsHashParam | undefined>(
    "inputs",
  );

  const addNewInput = useCallback(
    (name: string, dataref: DataRef) => {
      const newInputs: InputsHashParam = {
        ...inputs,
        [name]: dataref,
      };
      setInputs(newInputs);
    },
    [inputs, setInputs],
  );

  const deleteInput = useCallback(
    (name: string) => {
      if (inputs) {
        const newInputs = { ...inputs };
        delete newInputs[name];

        // If no inputs left, remove the hash parameter entirely
        if (Object.keys(newInputs).length === 0) {
          setInputs(undefined);
        } else {
          setInputs(newInputs);
        }
      }
    },
    [inputs, setInputs],
  );

  const inputEntries = inputs ? Object.entries(inputs) : [];

  return (
    <VStack width="100%" pt={5} gap={4}>
      <HStack
        alignItems="flex-start"
        px={5}
        width="100%"
        justifyContent="space-between"
      >
        <VStack alignItems={"flex-start"}>
          <Text fontWeight={600}>Embed Initial Inputs</Text>
          <Text>
            Define initial input values (embedded in the URL) to pass to the
            onInputs function or access directly via fetching the URL
          </Text>
        </VStack>
      </HStack>

      <Center width="100%">
        <AddInputButtonAndModal add={addNewInput} text={"Add Input"} />
      </Center>

      <VStack gap={4} alignItems="flex-start" width="100%">
        <VStack gap={0} alignItems="flex-start" width="100%">
          {inputEntries.map(([name, dataref], i) => (
            <VStack key={name} width="100%" gap={0}>
              <HStack px={5} width="100%" justify="space-between" py={2}>
                <InputRow
                  name={name}
                  dataref={dataref}
                  onDelete={() => deleteInput(name)}
                />
              </HStack>
              {i < inputEntries.length - 1 && (
                <HStack width="100%" px={5}>
                  <Text
                    borderBottom="1px solid"
                    borderColor="var(--line)"
                    width="100%"
                  />
                </HStack>
              )}
            </VStack>
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
};
