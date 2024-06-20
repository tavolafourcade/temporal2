import Image from "next/image";
import { extractImageUrl, isImageUrl, isVoiceMemo } from "./MessageList";
import {
  CheckIcon,
  PaperAirplaneIcon,
  SignalSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Message {
  content: string;
  role: string;
  timestamp: Date;
  sent_by?: string;
  status?: string;
}

interface MessageProps {
  message: Message;
  index: number;
  local?: boolean;
}

const Message: React.FC<MessageProps> = ({ message, index, local }) => {
  console.log(message);
  if (local) console.log("local message");
  return (
    <div
      key={index}
      className={`p-2 ${
        message.role === "assistant"
          ? "text-blue-600"
          : message.sent_by == "Closer"
          ? "text-purple-400"
          : "text-gray-800 dark:text-[#c4c3c0]"
      }`}
    >
      {isImageUrl(message.content) ? (
        <Image
          width={200}
          height={200}
          src={extractImageUrl(message.content)}
          alt="Image"
          unoptimized={true}
        />
      ) : isVoiceMemo(message.content) ? (
        <audio controls>
          <source src={message.content.split(".caf")[0]} type="audio/mpeg" />
          Your browser does not support the audio tag.
        </audio>
      ) : (
        <div>{message.content}</div>
      )}
      {message.sent_by != undefined && (
        <div className="text-sm text-gray-500 dark:text-gray-dm_light">
          {"Sent by: " + message.sent_by}
        </div>
      )}

      <div className="flex text-sm text-gray-500 dark:text-gray-dm_light">
        {message.timestamp.toLocaleString()}
        {message.status != undefined && (
          <span className="text-green-600">
            {message.status === "SENT" && <CheckIcon className="h-5 w-5" />}
            {message.status === "DELIVERED" && (
              <div className="flex ">
                <CheckIcon className="h-5 w-5" />
                <CheckIcon className="-ml-1 h-5 w-5" />
              </div>
            )}
            {message.status == "QUEUED" && (
              <div className="flex text-gray-400 ">
                <PaperAirplaneIcon className="h-5 w-5" />
              </div>
            )}
            {message.status === "RETRYING" && (
              <div className="flex text-yellow-500 ">
                <SignalSlashIcon className="h-5 w-5" />
              </div>
            )}
            {message.status === "FAILED" && (
              <div className="flex text-red-500 ">
                <XMarkIcon className="h-5 w-5" />
              </div>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
