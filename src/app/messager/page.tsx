"use client";
// pages/index.js
import { useEffect, useState } from "react";
import ConversationList from "../../components/ConversationList";
import MessageList from "../../components/MessageList";
import MessageInput from "../../components/MessageInputs";
import OptionSelector from "@/components/OptionsSelector";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase_config";
import PromptManager from "@/components/PromptManager";
import SearchInput from "@/components/SearchInput";
import { doc, getDoc } from "firebase/firestore";
import { getIdToken } from "@firebase/auth";
import { ScrollPositionProvider } from "@/components/ScrollPositionProvider";
import { SunIcon } from "@heroicons/react/24/outline";

const idToAliasMapping = {
  "": "",
};
let options = Object.entries(idToAliasMapping).map(([id, alias]) => ({
  value: id,
  label: alias,
}));

export default function Home() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedOption, setSelectedOption] = useState<string>(
    options[0].value
  );
  const [user, loading] = useAuthState(auth);
  const [token, setToken] = useState("");
  const [takeoverStatus, setTakeoverStatus] = useState(false);
  const [nudgeStatus, setNudgeStatus] = useState(false);
  const [promptManagerActive, setPromptManagerActive] = useState(false);
  const [claim, setClaim] = useState<any>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [convoClaimedBy, setConvoClaimedBy] = useState<any>("");
  const [aiCheckboxValue, setAiCheckboxValue] = useState(false);
  const [igDM, setIGDM] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      // Add the 'dark' class to the html element
      document.documentElement.classList.add("dark");
      // Optionally, remove the class on cleanup if you want to toggle dark mode
      return () => document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSearch = async (searchTerm: any) => {
    // Logic to filter conversations based on searchTerm
    // This might involve setting a state or calling an API
    if (!searchTerm.includes("+")) {
      searchTerm = "+" + searchTerm;
    }
    const docRes = await getDoc(
      doc(db, "users", selectedOption!, "convos", searchTerm!)
    );
    if (docRes.exists()) {
      setSelectedConversationId(searchTerm);
    }
  };

  const setOptions = async () => {
    const result = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/get_clients",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token!,
        },
      }
    );

    let { idmapping } = await result.json();

    options = Object.entries(idmapping).map(([id, alias]) => ({
      value: id,
      label: alias,
    })) as any;

    if (selectedOption == "") {
      setSelectedOption(options[0].value);
    }

    // setSelectedOption(selectedOption);
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
      user.getIdTokenResult(true).then((tokenResult) => {
        console.log(tokenResult.claims);
        setClaim(tokenResult.claims.account);
      });
    }
    if (token) {
      setOptions();
    }
  }, [user, loading, token]);

  const handleSelectConversation = (
    id: string,
    takeover: boolean,
    nudge: boolean
  ) => {
    console.log(id);
    setSelectedConversationId(id);

    setTakeoverStatus(takeover);
    setNudgeStatus(nudge);
  };

  const toggleNudge = async () => {
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
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/toggleNudge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        lead_phone: selectedConversationId,
        nudge: !nudgeStatus,
      }),
    });
    setNudgeStatus(!nudgeStatus);
  };

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
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/takeover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        lead_phone: selectedConversationId,
        takeover: !takeoverStatus,
      }),
    });
    setTakeoverStatus(!takeoverStatus);
  };

  const handleSendMessage = async (
    message: string,
    isCheckboxChecked: boolean,
    scheduledTime?: Date
  ) => {
    // Logic to send message
    console.log(
      `Sending message: ${message} to conversation ${selectedConversationId}`
    );
    let tok = await user?.getIdToken(true);
    setToken(tok!);
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
          uid: selectedOption,
        }),
      }
    );
    const { apiKey } = await result.json();
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/authed_follow_up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: tok!,
      },
      body: JSON.stringify({
        lead_phone: selectedConversationId,
        message: message,
        takeover: isCheckboxChecked,
        scheduled_time: scheduledTime,
      }),
    });
    setToken(tok!);

    if (convoClaimedBy == user?.uid || convoClaimedBy == undefined) {
      await fetch(process.env.NEXT_PUBLIC_URL + "/api/update_read_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: tok!,
        },
        body: JSON.stringify({
          lead_phone: selectedConversationId,
          read_status: true,
        }),
      });
    }
  };

  if (claim != "ecj" && claim != "bylders" && selectedOption != "") {
    return (
      <ScrollPositionProvider>
        <div className="flex dark:bg-[#1c1e20] dark:text-gray-300">
          <div className="w-[30%]">
            <div className="flex">
              <OptionSelector
                options={options}
                onSelectOption={setSelectedOption}
              />

              {/* <button
                onClick={() => setPromptManagerActive(!promptManagerActive)}
                className="bg-blue-500 ml-4 text-white my-1 rounded p-2"
              >
                {!promptManagerActive ? "Prompt" : "Conversations"}
              </button> */}
              <button
                className="ml-2 text-center justify-center"
                onClick={() => setDarkMode(!darkMode)}
              >
                <SunIcon className="h-8 w-8 " />
              </button>
            </div>
            {promptManagerActive ? (
              <PromptManager selectedDocumentId={selectedOption} />
            ) : (
              <div>
                <SearchInput
                  onSearch={handleSearch}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
                <div className="checkbox-container">
                  <label className="ml-2 flex">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        console.log(e.target.checked);
                        setAiCheckboxValue(e.target.checked);
                      }}
                    />
                    <p className="ml-2">Show AI Only?</p>
                  </label>
                </div>

                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedDocumentId={selectedOption}
                  conversationId={selectedConversationId!}
                  admin={true}
                  folder=""
                  onListUpdated={() => {}}
                  aiCheckboxValue={aiCheckboxValue}
                  setIGDM={setIGDM}
                  igLead={false}
                />
              </div>
            )}
          </div>
          <div className="w-[70%] max-h-vh">
            {selectedConversationId && (
              <>
                <MessageList
                  conversationId={selectedConversationId}
                  selectedDocumentId={selectedOption}
                  setClaimer={setConvoClaimedBy}
                  setIGDM={setIGDM}
                />
                <MessageInput
                  onSendMessage={handleSendMessage}
                  takeoverStatus={takeoverStatus}
                  convoClaimedBy={convoClaimedBy}
                  conversationId={selectedConversationId}
                  selectedDocumentId={selectedOption}
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
                {nudgeStatus ? (
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
                )}
              </>
            )}
          </div>
        </div>
      </ScrollPositionProvider>
    );
  } else {
    return <div>Not authorized</div>;
  }
}
