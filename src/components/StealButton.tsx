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

interface StealButtonProps {
  conversationId: string;
  selectedDocumentId: string;
  igLead: boolean;
}

const StealButton: React.FC<StealButtonProps> = ({
  conversationId,
  selectedDocumentId,
  igLead,
}) => {
  const [user, loading] = useAuthState(auth);

  const [data, setData] = useState<any>({});
  const [time, setTime] = useState(new Date());
  const [phone, setPhone] = useState<string>("");
  const [enableSteal, setEnableSteal] = useState<boolean>(false);
  console.log(selectedDocumentId);
  console.log(enableSteal);
  useEffect(() => {
    // Create the interval
    const intervalId = setInterval(() => {
      console.log("Updating time");
      setTime(new Date());
    }, 60000); // Refresh time every minute (60000 ms)

    // Cleanup function to clear the interval
    return () => {
      console.log("Clearing interval");
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    console.log("new data");
    console.log(data);
    if (data != undefined && data.last_updated != undefined) {
      // if the last updated field is over 30 min old
      const now = new Date() as any;
      //let lastUpdate;
      console.log(data.last_updated);
      const lastUpdate = new Date(data.last_updated.toDate()) as any;

      console.log(lastUpdate);
      const differenceInMinutes = Math.floor((now - lastUpdate) / 60000);

      console.log("Difference in minutes: ", differenceInMinutes);
      // Need lead to have been last to respond
      let lastSentByLead = data.sent_by[data.sent_by.length - 1] == "Lead";
      console.log("lastSentByLead", lastSentByLead);
      let leadOwner = data.claimed_by;
      setEnableSteal(
        leadOwner != user!.uid && lastSentByLead && differenceInMinutes >= 30
      );
    }
  }, [data]);

  useEffect(() => {
    console.log("effect triggered");
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

        setData(data);
      }
    });

    return () => unsubscribe();
  }, [conversationId, selectedDocumentId, time, igLead]);

  const notify = () => toast.success("Lead successfully stolen");
  const failed = () => toast.error("Lead steal failed");

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
      process.env.NEXT_PUBLIC_URL + "/api/update_setter_claim",
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
          ig_lead: igLead,
        }),
      }
    );
    if (res.status == 200) {
      notify();
    } else if (res.status != 200) {
      failed();
    }
  };

  return (
    <div className="flex space-x-4 mr-10">
      <button
        disabled={!enableSteal}
        onClick={(e) => handleButtonClick(e)}
        className="disabled:bg-gray-300 bg-blue-500 w-32 hover:bg-blue-700 mt-2 text-white rounded p-2"
      >
        STEAL
      </button>
    </div>
  );
};

export default StealButton;
