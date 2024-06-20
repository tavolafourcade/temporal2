// components/MessageList.tsx
import React, { useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

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
}

const ZapButton: React.FC<MessageListProps> = ({
  conversationId,
  selectedDocumentId,
  aiLead,
}) => {
  const [user, loading] = useAuthState(auth);

  const [phone, setPhone] = useState<string>("");
  console.log(selectedDocumentId);

  useEffect(() => {
    let q = doc(
      db,
      "users",
      "E8hMIZLZbKyHvZY3RhiD",
      "pages",
      "17841400230046321",
      "convos",
      conversationId
    );

    const unsubscribe = onSnapshot(q, (doc) => {
      const data = doc.data();
      console.log(data);
      if (data != undefined) {
        console.log("js sucks");
        console.log(data.precall_vid);
        console.log(data.final_nudge);
        console.log(data.takeover);
      }
    });

    return () => unsubscribe();
  }, [conversationId, selectedDocumentId]);

  const notify = () => toast.success("Phone number sent to Close.io");

  const handleButtonClick = async (e: React.FormEvent) => {
    e.preventDefault();

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
      process.env.NEXT_PUBLIC_URL + "/api/send_ig_lead_to_close",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,

          Authorization: tok!,
        },
        body: JSON.stringify({
          lead_id: conversationId,
          doc_id: selectedDocumentId,
          lead_phone: phone,
        }),
      }
    );
    if (res.status == 200) {
      notify();
    }
  };

  return (
    <div className="flex space-x-4 mr-10">
      <input
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
        }}
        type="text"
        className="ml-2 my-4 rounded dark:bg-[#2f2e2e]"
        placeholder="Phone Number..."
      />
      <button
        onClick={(e) => handleButtonClick(e)}
        className="bg-orange-600 hover:bg-orange-700 mt-2 text-white rounded p-2 w-32"
      >
        Zap to Close
      </button>
    </div>
  );
};

export default ZapButton;
