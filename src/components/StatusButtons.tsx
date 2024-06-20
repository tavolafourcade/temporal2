// components/MessageList.tsx
import React, { useEffect, useRef, useState } from "react";

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

interface Message {
  content: string;
  role: string;
  timestamp: Date;
}

interface MessageListProps {
  conversationId: string;
  selectedDocumentId: string;
  aiLead: boolean;
  igLead: boolean;
}

const MessageStatusButtons: React.FC<MessageListProps> = ({
  conversationId,
  selectedDocumentId,
  aiLead,
  igLead,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [data, setData] = useState<any>({});
  const [user, loading] = useAuthState(auth);
  const [takeoverStatus, setTakeoverStatus] = useState(false);
  const [nudgeStatus, setNudgeStatus] = useState(false);
  const [ngmiText, setNgmiText] = useState("NGMI");
  const [optOutText, setOptOutText] = useState("Opt Out");

  console.log(takeoverStatus);
  console.log(selectedDocumentId);

  useEffect(() => {
    setNgmiText("NGMI");
    setOptOutText("Opt Out");
    let q;
    if (igLead) {
      q = doc(
        db,
        "users",
        "E8hMIZLZbKyHvZY3RhiD",
        "pages",
        "17841400230046321",
        "convos",
        conversationId
      );
    } else {
      q = doc(db, "users", selectedDocumentId, "convos", conversationId);
    }

    const unsubscribe = onSnapshot(q, (doc) => {
      const data = doc.data();
      console.log(data);
      if (data != undefined) {
        console.log("js sucks");
        console.log(data.precall_vid);
        console.log(data.final_nudge);
        console.log(data.takeover);
        setData(data);

        setTakeoverStatus(data.takeover || data.precall_vid);
        setNudgeStatus(data.final_nudge || data.precall_vid);
      }
    });

    return () => unsubscribe();
  }, [conversationId, selectedDocumentId]);

  const handleButtonClick = async (status: string, e: React.FormEvent) => {
    e.preventDefault();
    if (status == "dq" && ngmiText == "NGMI") {
      setNgmiText("Confirm");
      return;
    }
    if (status == "hard_dq" && optOutText == "Opt Out") {
      setOptOutText("Confirm");
      return;
    }
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
    console.log(apiKey);
    console.log("key");
    const res = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/update_convo_status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,

          Authorization: tok!,
        },
        body: JSON.stringify({
          lead_phone: conversationId,
          doc_id: selectedDocumentId,
          lead_status: status,
          ig_lead: igLead,
        }),
      }
    );
    setNgmiText("NGMI");
  };

  const toggleTakeover = async () => {
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

    if (aiLead) {
      await fetch(process.env.NEXT_PUBLIC_URL + "/api/takeover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: tok!,
        },
        body: JSON.stringify({
          lead_phone: conversationId,
          takeover: !takeoverStatus,
          ig_lead: igLead,
        }),
      });
    } else if (igLead) {
      await fetch(process.env.NEXT_PUBLIC_URL + "/api/takeover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CONSTANTS.ECJ_IG_API_KEY,
          Authorization: tok!,
        },
        body: JSON.stringify({
          lead_phone: conversationId,
          takeover: !takeoverStatus,
        }),
      });
    }

    setTakeoverStatus(!takeoverStatus);
  };

  const toggleNudge = async () => {
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

    await fetch(process.env.NEXT_PUBLIC_URL + "/api/toggleNudge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        lead_phone: conversationId,
        nudge: !nudgeStatus,
        ig_lead: igLead,
      }),
    });
    setNudgeStatus(!nudgeStatus);
  };

  return (
    <div className="flex space-x-4">
      {selectedDocumentId == CONSTANTS.ECJ_ID &&
        (!data.user_opted_out ? (
          <button
            onClick={(e) => handleButtonClick("hard_dq", e)}
            className="bg-black hover:bg-gray-700 mt-2 text-white rounded p-2 w-20"
          >
            {optOutText}
          </button>
        ) : (
          <button
            onClick={(e) => handleButtonClick("undo_hard_dq", e)}
            className="bg-black hover:bg-gray-700 mt-2 text-white rounded p-2 w-20"
          >
            Undo Opt Out
          </button>
        ))}
      {!data.marked_dq ? (
        <button
          onClick={(e) => handleButtonClick("dq", e)}
          className="bg-red-500 hover:bg-red-700 mt-2 text-white rounded p-2 w-20"
        >
          {ngmiText}
        </button>
      ) : !data.user_opted_out ? (
        <button
          onClick={(e) => handleButtonClick("undo_dq", e)}
          className="bg-red-500 hover:bg-red-700 mt-2 text-white rounded p-2 w-24"
        >
          Undo NGMI
        </button>
      ) : (
        <button
          onClick={(e) => handleButtonClick("dq", e)}
          className="bg-red-500 hover:bg-red-700 mt-2 text-white rounded p-2 w-20"
        >
          {ngmiText}
        </button>
      )}
      {!data.marked_completed ? (
        <button
          onClick={(e) => handleButtonClick("completed", e)}
          className="bg-green-500 hover:bg-green-700 mt-2 text-white rounded p-2"
        >
          Complete
        </button>
      ) : (
        <button
          onClick={(e) => handleButtonClick("undo_completed", e)}
          className="bg-green-500 hover:bg-green-700 mt-2 text-white rounded p-2"
        >
          Undo Complete
        </button>
      )}

      {(aiLead || user?.uid == CONSTANTS.YOON_ID) &&
        (takeoverStatus ? (
          <button
            onClick={toggleTakeover}
            className="bg-purple-500 mt-2 text-white rounded p-2"
          >
            Hand back to AI
          </button>
        ) : (
          <button
            onClick={toggleTakeover}
            className="bg-purple-500 mt-2 text-white rounded p-2"
          >
            Freeze AI
          </button>
        ))}
      {(aiLead || selectedDocumentId == CONSTANTS.ECOM_FAMILY_ID) &&
        (nudgeStatus ? (
          <button
            onClick={toggleNudge}
            className="ml-4 bg-orange-500 mt-2 text-white rounded p-2"
          >
            Turn nudges back on
          </button>
        ) : (
          <button
            onClick={toggleNudge}
            className="ml-4 bg-orange-500 mt-2 text-white rounded p-2"
          >
            Turn off nudges
          </button>
        ))}
    </div>
  );
};

export default MessageStatusButtons;
