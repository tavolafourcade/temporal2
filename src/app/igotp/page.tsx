"use client";
// pages/index.js
import { useEffect, useState } from "react";
import ConversationList from "../../components/ConversationList";
import MessageList from "../../components/MessageList";
import MessageInput from "../../components/MessageInputs";
import OptionSelector from "@/components/OptionsSelector";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase_config";
import { doc, getDoc } from "firebase/firestore";
import FBOptionSelector from "@/components/FBOptionSelector";
import FBConversationList from "@/components/FBConversationList";
import FBMessageList from "@/components/FBMessageList";

import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const [otpCode, setToken] = useState<string>("");
  const [options, setOptions] = useState<any[]>(["place"]);
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  const [accessToken, setAccessToken] = useState<string>("");
  const [pageId, setPageId] = useState<string>("");

  // // dont allow user to chat if not logged in
  // useEffect(() => {
  //   if (!user && !loading) {
  //     window.location.href = "/login";
  //   }
  // }, [user, loading]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "30%" }}>
        <p className="m-2">Generate IG OTP Code</p>
        {/* Want to have a button that caclls the API, and then  display the  code below: CODDE:  */}

        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={async () => {
              const response = await fetch(
                process.env.NEXT_PUBLIC_URL + "/api/ig_otp",
                {
                  method: "POST",

                  body: JSON.stringify({}),
                }
              );
              const data = await response.json();
              console.log(data);
              setToken(data.otpCode);
            }}
          >
            Click here
          </button>
          <p>CODE: {otpCode}</p>
        </div>
      </div>
    </div>
  );
}
