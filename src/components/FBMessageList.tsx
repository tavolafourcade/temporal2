// components/MessageList.tsx
import React, { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase_config";
import Image from "next/image";

interface Message {
  content: string;
  role: string;
  timestamp: Date;
}

interface MessageListProps {
  conversationId: string;
  selectedDocumentId: string;
}

const FBMessageList: React.FC<MessageListProps> = ({
  conversationId,
  selectedDocumentId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  console.log(messages);
  console.log(selectedDocumentId);
  console.log(conversationId);
  useEffect(() => {
    const q = doc(
      db,
      "users",
      "jw4wwo7gu6ZEKTNmTYEs8nhtIvJ2",
      "pages",
      selectedDocumentId,
      "convos",
      conversationId
    );

    const unsubscribe = onSnapshot(q, (doc) => {
      const cities = [];
      //   querySnapshot.forEach((doc) => {
      //     cities.push({ id: doc.id, ...(doc.data() as Message) });
      //   });
      //remove first 2 messages
      const data = doc.data();
      if (data == undefined) {
        setMessages([]);
      } else {
        console.log(data);
        const combinedMessages = data!.messages
          .splice(2)
          .map((msg: Message, index: number) => ({
            ...msg,
            timestamp: data!.timestamps[index].toDate(), // Or convert to appropriate format
          }));
        setMessages(combinedMessages);
      }
    });

    return () => unsubscribe();
  }, [conversationId, selectedDocumentId]);

  // Function to check if message content is an image URL
  const isImageUrl = (content: string) => {
    return content.includes("CDN:") || content.includes("https://lookaside");
  };

  // Function to extract and format image URL
  const extractImageUrl = (content: string) => {
    // Modify this based on how your CDN links are structured
    const urlStartIndex = content.indexOf("https://");
    let hi = urlStartIndex !== -1 ? content.substring(urlStartIndex) : "";
    console.log(hi);
    return hi;
  };

  console.log(messages);
  return (
    <div>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-2 ${
            message.role === "assistant" ? "text-blue-600" : "text-gray-800"
          }`}
        >
          {isImageUrl(message.content) ? (
            <Image
              width={100}
              height={50}
              src={extractImageUrl(message.content)}
              alt="Expired Story"
              unoptimized={true}
            />
          ) : (
            <div>{message.content}</div>
          )}

          <div className="text-sm text-gray-500">
            {message.timestamp.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FBMessageList;
