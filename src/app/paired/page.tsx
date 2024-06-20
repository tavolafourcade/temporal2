// App.tsx or similar entry file
"use client";

import React from "react";
import ECJ from "../../components/ECJ";
import { ScrollPositionProvider } from "../../components/ScrollPositionProvider";
import Paired from "@/components/Paired";

const App: React.FC = () => {
  return (
    <ScrollPositionProvider>
      <Paired />
    </ScrollPositionProvider>
  );
};

export default App;
