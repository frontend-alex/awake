import React from "react";
import { Image, View } from "react-native";

const Loading = () => {
  return (
    <View className="flex-1 flex flex-col gap-3 justify-center items-center bg-background">
      <Image
        source={require("@assets/icon.png")}
        className="size-20 animate-pulse"
      />
    </View>
  );
};

export default Loading;
