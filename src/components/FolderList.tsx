import React from "react";

interface FolderListProps {
  onSelectFolder: (folder: string) => void;
  showAll?: boolean;
}

const FolderList: React.FC<FolderListProps> = ({ onSelectFolder, showAll }) => {
  let folders: string[] = ["Active", "NGMI", "Completed"];
  if (showAll) folders.push("All");

  return (
    <select
      onChange={(e) => onSelectFolder(e.target.value)}
      className="my-2 p-2 border dark:border-hidden rounded dark:bg-gray-500"
    >
      {folders.map((folder) => (
        <option key={folder} className="folder-item">
          {folder}
        </option>
      ))}
    </select>
  );
};

export default FolderList;
