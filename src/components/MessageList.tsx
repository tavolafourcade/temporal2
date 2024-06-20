// components/MessageList.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../firebase_config";
import { useAuthState } from "react-firebase-hooks/auth";
import * as CONSTANTS from "../../constants";
import NotesSection from "./NotesSection";
import Image from "next/image";
import Message from "./Message";
import {
  InstagramSettings,
  emptyInstagramSettings,
  getCompanyOverrideData,
} from "./ConversationList";

export interface MessageInterface {
  content: string;
  role: string;
  timestamp: Date;
  sent_by?: string;
  status?: string;
}

interface MessageListProps {
  conversationId: string;
  selectedDocumentId: string;
  setClaimer: (claimer: string) => void;
  setIGDM: (state: boolean) => void;
  userView?: string;
  localMessages?: Message;
  setLocalMessages?: (localMessages: MessageInterface) => void;
  queryParamCompanyOverride?: string | null;
}

// Function to check if message content is an image URL
export const isImageUrl = (content: string) => {
  return (
    (content.includes("https://storage.googleapis.com") ||
      content.includes("https://api.twilio.com/") ||
      content.includes("https://lookaside")) &&
    !content.endsWith(".caf")
  );
};

export const extractImageUrl = (content: string) => {
  // Modify this based on how your CDN links are structured
  const urlStartIndex = content.indexOf("https://");
  let hi = urlStartIndex !== -1 ? content.substring(urlStartIndex) : "";
  console.log(hi);
  return hi;
};

export const isVoiceMemo = (content: string) => {
  return content.endsWith(".caf");
};

const MessageList: React.FC<MessageListProps> = ({
  conversationId,
  selectedDocumentId,
  setClaimer,
  setIGDM,
  userView,
  localMessages,
  setLocalMessages,
  queryParamCompanyOverride = null,
}) => {
  const [user, loading] = useAuthState(auth);

  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [data, setData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null); // Create a ref
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [userClaims, setUserClaims] = useState<any>({});
  const [instagramSettings, setInstagramSettings] = useState<InstagramSettings>(
    emptyInstagramSettings
  );

  // Function to save notes (example logic, adjust based on your backend)
  const handleSaveNotes = async (notes: string) => {
    let tok = await user?.getIdToken(true);
    // first we need to get the API key
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
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/update_notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: tok!,
      },
      body: JSON.stringify({
        lead_phone: conversationId,
        notes: notes,
      }),
    });
  };

  const handleCancelScheduled = async () => {
    console.log("hi");
    // Logic to send message

    let tok = await user?.getIdToken(true);
    // first we need to get the API key
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
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/update_scheduled_msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: tok!,
      },
      body: JSON.stringify({
        lead_phone: conversationId,
        schedule_status: false,
      }),
    });
  };

  useEffect(() => {
    if (!user && !loading) window.location.href = "/login";

    if (user) {
      user.getIdToken().then((token) => setToken(token));
      user
        .getIdTokenResult(true)
        .then((tokenResult) => setUserClaims(tokenResult.claims));
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const { isRazAdmin, instagramSettings: companyInstagramSettings = null } =
      userClaims;

    if (queryParamCompanyOverride || isRazAdmin) {
      const currentLocation = window.location.pathname;
      const currentCompanyName = currentLocation.split("/")[1];

      const companyOverride = queryParamCompanyOverride || currentCompanyName;

      getCompanyOverrideData(
        user,
        token,
        companyOverride,
        !queryParamCompanyOverride
      )
        .then((overrideData) =>
          overrideData.ok ? overrideData.json() : emptyInstagramSettings
        )
        .then((overrideData) => setInstagramSettings(overrideData))
        .catch(() => setInstagramSettings(emptyInstagramSettings));
    } else {
      setInstagramSettings(companyInstagramSettings);
    }
  }, [user, token, userClaims, queryParamCompanyOverride]);

  useEffect(() => {
    const { instagramId, instagramPageId } = instagramSettings || {};

    const isInstagram = !conversationId.startsWith("+");
    setIGDM(isInstagram);

    if (!userClaims.companyId || (isInstagram && !instagramId)) return;

    const query = isInstagram
      ? doc(
          db,
          "users",
          instagramId,
          "pages",
          instagramPageId,
          "convos",
          conversationId
        )
      : doc(db, "users", selectedDocumentId, "convos", conversationId);

    const unsubscribe = onSnapshot(query, (doc) => {
      const data = doc.data();

      if (data) {
        setData(data);
        setPhone(data.ai_number);

        const creationTime = data.timestamps[0]
          ? data.timestamps[0].toDate()
          : data.creation_time.toDate();
        const migrationStartTime = new Date(CONSTANTS.TEST_START);

        if (!data!.new_ai_saving || creationTime < migrationStartTime) {
          const combinedMessages = data!.messages
            .splice(2)
            .map((msg: MessageInterface, index: number) => ({
              ...msg,
              timestamp: data!.timestamps[index].toDate(),
            }));

          setMessages(combinedMessages);
          setClaimer(data?.claimed_by);
        } else {
          //first i would like to iterate over the values in the statuses map and push the position field into an array
          let statuses = data.statuses;

          //inline define object with status property
          let positions: { [key: string]: any } = {};

          for (let key in statuses) {
            let val = statuses[key];
            //each of these vals ahs a position field and a status field
            // I would like to create an array of the statuses in the order of the position field

            // theres a special case. If positions[val.position] already exists and its
            // status is DELIVERED, then we should not overwrite it with a QUEUED status
            if (
              positions[val.position] != undefined &&
              positions[val.position].status == "DELIVERED"
            ) {
              continue;
            }

            positions[val.position] = val;
          }

          let combinedMessages;
          if (
            data.sent_by != undefined &&
            data.sent_by.length == data.messages.length
          ) {
            combinedMessages = data!.messages.map(
              (msg: Message, index: number) => ({
                ...msg,
                timestamp: data!.timestamps[index].toDate(), // Or convert to appropriate format
                sent_by: data!.sent_by[index],
                status: positions[index]?.status,
              })
            );
          } else {
            combinedMessages = data!.messages.map(
              (msg: Message, index: number) => ({
                ...msg,
                timestamp: data!.timestamps[index].toDate(), // Or convert to appropriate format
              })
            );
          }

          if (setLocalMessages != undefined) {
            setLocalMessages({} as any as MessageInterface);
          }

          setMessages(combinedMessages);
          setClaimer(data?.claimed_by);
        }
      }
    });

    return () => unsubscribe();
  }, [user, userClaims, selectedDocumentId, conversationId, instagramSettings]);

  useEffect(() => {
    const scrollToBottom = () => {
      const current = messagesEndRef.current;
      if (current) {
        current.scrollTop = current.scrollHeight;
      }
    };

    scrollToBottom();
  }, [messages, localMessages]);

  if (localMessages !== undefined) {
    console.log("localMessages.content:", localMessages.content);
  }

  const memoizedMessageList = useMemo(
    () =>
      messages.map((message, index) => (
        <Message key={index} message={message} index={index} />
      )),
    [messages]
  );

  return (
    <div className="flex flex-col flex-grow  ">
      <div className="mb-4 m-2 border p-2 rounded-lg max-h-32 overflow-y-auto flex">
        {!isEditingNotes && (
          <div className="w-[95%]">
            <p>Adset: {data.adset_name}</p>
            {data.username != undefined ? (
              <a
                target="_blank"
                href={`https://instagram.com/${data.username}`}
              >
                Instagram Profile : {data.username}
              </a>
            ) : (
              <p>Email: {data.email}</p>
            )}
            {data.appinfo != undefined ? (
              <p>Application: {data.app_info}</p>
            ) : (
              <p>Budget: {data.budget}</p>
            )}
          </div>
        )}
        <NotesSection
          currConversationId={conversationId}
          initialNotes={data.setter_notes || ""}
          onSave={handleSaveNotes}
          isEditing={isEditingNotes}
          setIsEditing={setIsEditingNotes}
        />
      </div>
      <div className="flex mr-8 justify-end">
        <p className="">{phone}</p>
      </div>
      <div
        ref={messagesEndRef}
        style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto" }}
      >
        {memoizedMessageList}
        {localMessages != undefined && localMessages.content != undefined && (
          <Message message={localMessages} index={1000} local={true} />
        )}
        {data.scheduled_msg_status && (
          <div key={"scheduled"} className={`p-2 text-blue-600`}>
            <div>{data.scheduled_msg_content}</div>
            <div className="text-sm text-gray-500">
              {"Scheduled for: " +
                data.scheduled_msg_time.toDate().toLocaleString()}
            </div>
            <button
              onClick={handleCancelScheduled}
              className="bg-red-500 text-sm hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
            >
              Cancel Scheduled Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
