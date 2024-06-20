"use client";

import React from "react";
import Messenger from "../../components/Messenger";
import { ScrollPositionProvider } from "../../components/ScrollPositionProvider";

const App: React.FC = () => {
  return (
    <ScrollPositionProvider>
      <Messenger />
    </ScrollPositionProvider>
  );
};

export default App;
