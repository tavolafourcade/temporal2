// components/NotesSection.tsx
import React, { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

interface NotesSectionProps {
  currConversationId: string;
  initialNotes: string;
  onSave: (notes: string) => void;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  currConversationId,
  initialNotes,
  onSave,
  isEditing,
  setIsEditing,
}) => {
  console.log("ugh");
  console.log(initialNotes);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (initialNotes != "") {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
    setNotes(initialNotes); // Ensure notes are updated if initialNotes change
  }, [initialNotes, currConversationId]);

  const handleSave = () => {
    onSave(notes);
    notify();
    // setIsEditing(false);
  };
  const handleCancel = () => {
    setIsEditing(false);
    setNotes(initialNotes);
  };

  const notify = () => toast.success("Note was saved successfully.");

  return (
    <div className={`${isEditing && "w-full"}`}>
      {isEditing ? (
        <>
          <textarea
            className="w-full p-2"
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              minHeight: "70px", // Minimum height to ensure visibility
              overflowY: "hidden", // Hide scrollbar
              resize: "none", // Prevent manual resizing
            }}
          />
          <button
            onClick={handleSave}
            className=" bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 w-20 rounded"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className=" bg-gray-500 hover:bg-gray-700 text-white font-bold p-2 w-36 rounded ml-4"
          >
            See Application
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className=" bg-gray-500 hover:bg-gray-700 text-white font-bold p-2 rounded w-20"
        >
          Notes
        </button>
      )}
      <Toaster />
    </div>
  );
};
export default NotesSection;
