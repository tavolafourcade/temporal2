// components/OptionSelector.tsx
import React from "react";

interface OptionSelectorProps {
  options: { value: string; label: string }[];
  onSelectOption: (option: string) => void;
}

// components/OptionSelector.js
const OptionSelector: React.FC<OptionSelectorProps> = ({
  options,
  onSelectOption,
}) => {
  console.log(options);
  return (
    <select
      onChange={(e) => onSelectOption(e.target.value)}
      className="p-2 border dark:border-black rounded dark:bg-gray-dm_dark"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default OptionSelector;
