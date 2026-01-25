import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import Loading from "@/components/loading";

export default function Home() {
  return (
    <SafeAreaView className="flex-1">
      <Loading />
    </SafeAreaView>
  );
}
