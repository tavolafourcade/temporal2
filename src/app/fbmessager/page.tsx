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
import FBMessageInput from "@/components/FBMessageInput";

export default function Home() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const [user, loading] = useAuthState(auth);
  const [token, setToken] = useState("");
  const [options, setOptions] = useState<any[]>(["place"]);
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);
  const [accessToken, setAccessToken] = useState<string>("");
  const [pageId, setPageId] = useState<string>("");
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followsCount, setFollowsCount] = useState<number>(0);
  const [username, setUsername] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [takeoverStatus, setTakeoverStatus] = useState(false);

  const toggleTakeover = async () => {
    const result = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/get_api_key",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token!,
        },
        body: JSON.stringify({
          uid: selectedOption,
        }),
      }
    );
    const { apiKey } = await result.json();
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/takeover_ig", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        lead_id: selectedConversationId,
        page_id: pageId,
        takeover: !takeoverStatus,
      }),
    });
    setTakeoverStatus(!takeoverStatus);
  };

  // dont allow user to chat if not logged in
  useEffect(() => {
    if (!user && !loading) {
      window.location.href = "/login";
    }
    if (user) {
      user.getIdToken().then((token) => {
        setToken(token);
      });
      const aa = getDoc(user && doc(db, "users", user?.uid!)).then((doc) => {
        if (doc.exists()) {
          console.log("Document data:", doc.data());
          setOptions(doc.data().pages);
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      });
    }
  }, [user, loading]);

  useEffect(() => {
    console.log(selectedOption);
    // need to get the page ID and access token for the selected option
    if (selectedOption == "place" && options[0] != "place") {
      console.log("setting selected option");
      console.log(options[0].page_id);
      setSelectedOption(options[0].page_id);
      return;
    }
    for (let option of options) {
      console.log(option);
      if (selectedOption == option.page_id) {
        console.log(option);
        setAccessToken(option.access_token);
        setPageId(option.page_id);

        if (option.followers_count != undefined) {
          setFollowersCount(option.followers_count);
          setFollowsCount(option.follows_count);
          setUsername(option.username);
          setWebsite(option.website);
        }
        // set the access token
        // set the page ID
      }
    }
  }, [selectedOption, options]);

  const handleSelectConversation = (id: string, takeover: boolean) => {
    console.log(id);
    setSelectedConversationId(id);
    setTakeoverStatus(takeover);
  };

  const handleSendMessage = async (
    message: string,
    isCheckboxChecked: boolean
  ) => {
    // Logic to send message
    console.log(
      `Sending message: ${message} to conversation ${selectedConversationId}`
    );

    await fetch(process.env.NEXT_PUBLIC_URL + "/api/follow_up_ig", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_id: pageId,
        access_token: accessToken,
        lead_id: selectedConversationId,
        message: message,
        takeover: isCheckboxChecked,
      }),
    });
  };
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "30%" }}>
        <p className="m-2">Choose Account</p>
        <FBOptionSelector
          options={options}
          onSelectOption={setSelectedOption}
        />
        {followersCount != 0 && (
          <div className="border my-4 p-2">
            {/* Button that hides the div */}
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-1 px-2 rounded"
              onClick={() => {
                setFollowersCount(0);
              }}
            >
              Hide
            </button>
            <div className="flex flex-col">
              <p>{followersCount} followers</p>
              {followsCount != undefined && <p>{followsCount} follows</p>}

              <p>Username: {username}</p>
              <p>Website: {website}</p>
            </div>
          </div>
        )}
        <FBConversationList
          onSelectConversation={handleSelectConversation}
          selectedDocumentId={selectedOption}
          accessToken={accessToken}
          pageId={pageId}
        />
      </div>
      <div style={{ width: "70%" }}>
        {selectedConversationId && (
          <>
            <FBMessageList
              conversationId={selectedConversationId}
              selectedDocumentId={selectedOption}
            />
            <FBMessageInput
              takeoverStatus={takeoverStatus}
              onSendMessage={handleSendMessage}
            />

            {takeoverStatus ? (
              <button
                onClick={toggleTakeover}
                className="bg-red-500 mt-2 text-white rounded p-2"
              >
                Hand back to AI
              </button>
            ) : (
              <button
                onClick={toggleTakeover}
                className="bg-red-500 mt-2 text-white rounded p-2"
              >
                Freeze AI
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
