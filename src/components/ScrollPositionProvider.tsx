import React, { createContext, useContext, useState } from "react";

interface ScrollPositionContextType {
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
}

const defaultState: ScrollPositionContextType = {
  scrollPosition: 0,
  setScrollPosition: () => {},
};

const ScrollPositionContext =
  createContext<ScrollPositionContextType>(defaultState);

export const useScrollPosition = () => useContext(ScrollPositionContext);

export const ScrollPositionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  return (
    <ScrollPositionContext.Provider
      value={{ scrollPosition, setScrollPosition }}
    >
      {children}
    </ScrollPositionContext.Provider>
  );
};
