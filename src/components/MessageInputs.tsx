import React, { use, useEffect, useState } from "react";
import { useScrollPosition } from "../components/ScrollPositionProvider";
import moment from "moment";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase_config";

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (
    message: string,
    isCheckboxChecked: boolean,
    scheduleTime?: Date
  ) => void;
  takeoverStatus: boolean;
  convoClaimedBy: string;
  selectedDocumentId: string;
  populateMessage?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSendMessage,
  takeoverStatus,
  convoClaimedBy,
  selectedDocumentId,
  populateMessage,
  // ... other props
}) => {
  const [message, setMessage] = useState("");
  const { scrollPosition } = useScrollPosition();

  const [scheduleSend, setScheduleSend] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  const [typingBubble, setTypingBubble] = useState(false);

  const [user, loading] = useAuthState(auth);

  function getUTCOffsetWithMoment() {
    // Get the current date and time with moment
    const now = moment();

    // Get the UTC offset in minutes and convert it to hours
    const offset = now.utcOffset();
    return offset / 60;
  }

  // const offset = getUTCOffsetWithMoment();
  const currTime = moment();

  useEffect(() => {
    console.log("populateMessage", populateMessage);
    setMessage(populateMessage || "");
  }, [populateMessage]);

  useEffect(() => {
    setTypingBubble(false);
  }, [conversationId]);

  // console.log(getUTCOffsetWithMoment());

  const toggleBubble = async () => {
    setTypingBubble(true);
    let tok = await user?.getIdToken(true);
    const result = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/get_api_key",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: tok!,
        },
        body: JSON.stringify({
          uid: selectedDocumentId,
        }),
      }
    );
    const { apiKey } = await result.json();

    await fetch(process.env.NEXT_PUBLIC_URL + "/api/typing_bubble", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: tok!,
      },
      body: JSON.stringify({
        lead_phone: conversationId,
      }),
    });

    setTimeout(async () => {
      setTypingBubble(false);
    }, 60000);
  };

  // ... existing code
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(message);
    console.log("helloooa");

    if (message === "") return;
    console.log("scrollPosition", scrollPosition);
    const conversationList = document.getElementById("conversation-list-id");
    if (conversationList) {
      conversationList.scrollTop = scrollPosition;
    }
    const scheduleTime =
      scheduleSend && scheduledTime ? new Date(scheduledTime) : undefined;
    onSendMessage(message, takeoverStatus, scheduleTime);
    setMessage("");
  };

  const handleScheduledSend = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(message);
    console.log("hellooo");
    if (message === "") return;
    // existing code for setting scroll position

    const scheduleTime =
      scheduleSend && scheduledTime ? new Date(scheduledTime) : undefined;
    onSendMessage(message, takeoverStatus, scheduleTime);
    setMessage("");
    setScheduledTime("");
    setScheduleSend(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log(message);
    if (!typingBubble && message !== "") {
      console.log("ttoggling");
      toggleBubble();
    }
    // Check if Enter key is pressed without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents adding a new line in the textarea
      handleSubmit(e);
    }
  };

  useEffect(() => {
    console.log(message);
    message == "" && setTypingBubble(false);
  }, [message, typingBubble]);

  return (
    <form onSubmit={handleScheduledSend} className="flex items-center p-2">
      <div className="flex flex-col w-full">
        <div className="flex ">
          <label className="flex ">
            <input
              className="dark:bg-blue-300"
              type="checkbox"
              checked={scheduleSend}
              onChange={() => setScheduleSend(!scheduleSend)}
            />
            <p className="ml-2"> Schedule Send</p>
          </label>

          {scheduleSend && (
            <input
              className="ml-4 rounded dark:bg-gray-300 dark:text-black accent-slate-500"
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={currTime.format("YYYY-MM-DDTHH:mm")} // Set min date and time to current
            />
          )}
        </div>

        <div className="flex relative items-center">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border dark:border-gray-dm_dark rounded p-2 mr-2 dark:bg-gray-dm_dark"
          />
          <style>
            {`
            @keyframes customPulse {
              0%, 100% { opacity: 0; }
              50% { opacity: 1; }
            }
          `}
          </style>
          {typingBubble && (
            <>
              <div
                className="absolute right-24 -top-5 w-1 h-1 bg-black rounded-full"
                style={{ animation: "customPulse 2s infinite" }}
              ></div>
              <div
                className="absolute right-[86px] -top-5 w-1 h-1 bg-black rounded-full"
                style={{
                  animation: "customPulse 2s infinite",
                  animationDelay: "0.3s",
                }}
              ></div>
              <div
                className="absolute right-[76px] -top-5 w-1 h-1 bg-black rounded-full"
                style={{
                  animation: "customPulse 2s infinite",
                  animationDelay: "0.6s",
                }}
              ></div>
            </>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white rounded p-2 h-10"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
