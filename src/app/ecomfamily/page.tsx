// App.tsx or similar entry file
"use client";

import React from "react";
import ECJ from "../../components/ECJ";
import { ScrollPositionProvider } from "../../components/ScrollPositionProvider";
import Bylders from "@/components/Bylders";
import ChatComponent from "@/components/ChatComponent";
import * as CONSTANTS from "../../../constants";
import Mentorme from "@/components/Mentorme";
import EcomFamily from "@/components/EcomFamily";

const App: React.FC = () => {
  return (
    <ScrollPositionProvider>
      <EcomFamily />
    </ScrollPositionProvider>
  );
};

export default App;
