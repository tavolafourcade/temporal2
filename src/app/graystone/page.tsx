// App.tsx or similar entry file
"use client";

import React from "react";
import ECJ from "../../components/ECJ";
import { ScrollPositionProvider } from "../../components/ScrollPositionProvider";
import Bylders from "@/components/Bylders";
import ChatComponent from "@/components/ChatComponent";
import * as CONSTANTS from "../../../constants";
import MLP from "@/components/MLP";
import Graystone from "@/components/Graystone";

const App: React.FC = () => {
  return (
    <ScrollPositionProvider>
      <Graystone />
    </ScrollPositionProvider>
  );
};

export default App;
