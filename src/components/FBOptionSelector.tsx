// components/OptionSelector.tsx
import React, { use, useEffect } from "react";

interface OptionSelectorProps {
  options: { page_name: string; page_id: string }[];
  onSelectOption: (option: string) => void;
}

// components/OptionSelector.js
const FBOptionSelector: React.FC<OptionSelectorProps> = ({
  options,
  onSelectOption,
}) => {
  console.log(options);
  // // when the options are loaded the firs time, select the first option
  // useEffect(() => {
  //   if (options.length > 0) {
  //     onSelectOption(options[0]);
  //   }
  // }, [options, onSelectOption]);
  return (
    <select
      onChange={(e) => onSelectOption(e.target.value)}
      className="p-2 border rounded"
    >
      {options.map((option) => (
        <option key={option.page_id!} value={option.page_id!}>
          {option.page_name}
        </option>
      ))}
    </select>
  );
};

export default FBOptionSelector;
