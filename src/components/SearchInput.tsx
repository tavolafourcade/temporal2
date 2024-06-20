import React, { useState } from "react";

interface SearchInputProps {
  onSearch: (message: string) => void;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="search-input">
      <input
        type="text"
        className="ml-2 my-4 rounded dark:bg-[#2f2e2e]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by number..."
      />
      <button
        className="bg-blue-500 ml-4 text-white my-1 rounded p-2"
        onClick={() => onSearch(searchTerm)}
      >
        Search
      </button>
    </div>
  );
};

export default SearchInput;
