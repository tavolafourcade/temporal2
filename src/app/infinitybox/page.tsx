// App.tsx or similar entry file
"use client";

import React from "react";
import ECJ from "../../components/ECJ";
import { ScrollPositionProvider } from "../../components/ScrollPositionProvider";
import Bylders from "@/components/Bylders";
import ChatComponent from "@/components/ChatComponent";
import * as CONSTANTS from "../../../constants";
import InfinityBox from "@/components/InfinityBox";

const App: React.FC = () => {
  return (
    <ScrollPositionProvider>
      <InfinityBox />
    </ScrollPositionProvider>
  );
};

export default App;
