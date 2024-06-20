import React from "react";
interface UserStatus {
  name: string;
  online: boolean;
  id: string;
}
interface FolderListProps {
  setters: UserStatus[];
  onSelectFolder: (folder: string) => void;
}

const SetterList: React.FC<FolderListProps> = ({ setters, onSelectFolder }) => {
  const folders: string[] = ["Active", "Favorites", "Completed", "DQ"];

  return (
    <select
      onChange={(e) => onSelectFolder(e.target.value)}
      className="my-2 p-2 border dark:border-hidden dark:bg-gray-500 rounded"
    >
      {setters.map((folder) => (
        <option key={folder.id} value={folder.id} className="folder-item">
          {folder.name}
        </option>
      ))}
    </select>
  );
};

export default SetterList;
