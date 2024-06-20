// App.tsx or similar entry file
"use client";

import React from "react";
import ECJ from "../../components/ECJ";
import { ScrollPositionProvider } from "../../components/ScrollPositionProvider";

const App: React.FC = () => {
  return (
    <ScrollPositionProvider>
      <ECJ />
    </ScrollPositionProvider>
  );
};

export default App;
