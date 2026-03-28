export function useBracketConnectorStroke(): Readonly<Ref<string>> {
  const colorMode = useColorMode();
  return computed(() => (colorMode.value === "dark" ? "#4b5563" : "#d1d5db"));
}
