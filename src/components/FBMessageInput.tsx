// components/MessageInputs.tsx
import React, { useState } from "react";

interface MessageInputProps {
  onSendMessage: (message: string, isCheckboxChecked: boolean) => void;
  takeoverStatus: boolean;
}

const FBMessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  takeoverStatus,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(message, takeoverStatus);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border rounded p-2 mr-2"
      />

      <button type="submit" className="bg-blue-500 text-white rounded p-2">
        Send
      </button>
    </form>
  );
};
export default FBMessageInput;
