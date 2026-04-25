import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { layout } from "../../core/theme/layout";

type Props = { children: React.ReactNode };

export function WebContainer({ children }: Props) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    overflow: "hidden",
  },
});
