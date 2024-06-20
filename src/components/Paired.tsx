// pages/index.js
import { useEffect, useState } from "react";
import ConversationList from "../components/ConversationList";
import MessageList, { MessageInterface } from "../components/MessageList";
import MessageInput from "../components/MessageInputs";
import OptionSelector from "@/components/OptionsSelector";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase_config";
import PromptManager from "@/components/PromptManager";
import { collection, doc, getDoc, query } from "firebase/firestore";
import SearchInput from "@/components/SearchInput";
import * as CONSTANTS from "../../constants";
import {
  ScrollPositionProvider,
  useScrollPosition,
} from "@/components/ScrollPositionProvider";
import FolderList from "@/components/FolderList";
import MessageStatusButtons from "@/components/StatusButtons";
import { OnlineModal } from "./OnlineModal";
import SetterList from "./SetterList";
import { SunIcon } from "@heroicons/react/24/outline";
import Message from "./Message";
import OnlineToggle from "./OnlineToggle";
import { useDocumentData } from "react-firebase-hooks/firestore";
import ZapButton from "./ZapButton";

const idToAliasMapping = {
  t4azRBK7OWDX08HgUdo6: "Paired",

  // Add more mappings if necessary
  //
};
const options = Object.entries(idToAliasMapping).map(([id, alias]) => ({
  value: id,
  label: alias,
}));

export default function Paired() {
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
  const [selectedFolder, setSelectedFolder] = useState<string>("Active");
  const [userStatus, setUserStatus] = useState("here"); // Default status is "here"

  const [onlineUsers, setOnlineUsers] = useState([]); // New state to store online users
  const [showModal, setShowModal] = useState(false);
  const [isLoadingOnlineUsers, setIsLoadingOnlineUsers] = useState(false);
  const [igDM, setIgDM] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<any[]>([
    { name: "All users", id: "All users" },
  ]);
  const [aiLead, setAiLead] = useState(false);

  const [selectedSetter, setSelectedSetter] = useState<string>("All users");
  const { scrollPosition } = useScrollPosition();
  const [darkMode, setDarkMode] = useState(true);
  // In the ECJ component
  const [localMessages, setLocalMessages] = useState<MessageInterface>(
    {} as MessageInterface
  );
  const [docvalue, docloading] = useDocumentData(
    doc(db, "users", selectedOption)
  );

  useEffect(() => {
    if (docvalue) {
      console.log("hmm");
      console.log(docvalue);
      if (docvalue?.avail_now) {
        if (docvalue.avail_now.includes(user?.uid)) {
          setUserStatus("here");
        } else {
          setUserStatus("away");
        }
      }
    }
  }, [docvalue, docloading]);
  useEffect(() => {
    if (darkMode) {
      // Add the 'dark' class to the html element
      document.documentElement.classList.add("dark");
      // Optionally, remove the class on cleanup if you want to toggle dark mode
      return () => document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const restoreScrollPosition = () => {
    console.log("page is aware of this scroll position: ", scrollPosition);

    const conversationList = document.getElementById("conversation-list-id");
    if (conversationList) {
      conversationList.scrollTop = scrollPosition;
    }
  };

  const handleSelectFolder = (folder: string) => {
    setSelectedFolder(folder);
  };
  const handleSelectSetter = (folder: string) => {
    console.log(folder);
    setSelectedSetter(folder);
    console.log("setter selected");
  };

  const handleSearch = async (searchTerm: any) => {
    // Logic to filter conversations based on searchTerm
    // This might involve setting a state or calling an API
    console.log(searchTerm);
    console.log(selectedOption);
    let searchingIG = false;
    if (searchTerm.length >= 15) {
      setIgDM(true);
      searchingIG = true;
    }

    if (searchingIG) {
      const docRes = await getDoc(
        doc(
          db,
          "users",
          CONSTANTS.ECJ_ID_IG,
          "pages",
          CONSTANTS.ECJ_ID_IG_PAGE,
          "convos",
          searchTerm!
        )
      );
      if (docRes.exists()) {
        setSelectedConversationId(searchTerm);
      }
    } else {
      if (!searchTerm.includes("+")) {
        searchTerm = "+" + searchTerm;
      }
      const docRes = await getDoc(
        doc(db, "users", selectedOption!, "convos", searchTerm!)
      );
      if (docRes.exists()) {
        setSelectedConversationId(searchTerm);
      }
    }
  };

  // dont allow user to chat if not logged in
  useEffect(() => {
    console.log("claimed by");
    console.log(convoClaimedBy);
    if (convoClaimedBy == CONSTANTS.LEO_ID) {
      setAiLead(true);
    } else {
      setAiLead(false);
    }
  }, [convoClaimedBy]);

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
        const currentHref = window.location.pathname;

        const {
          isRazAdmin = false,
          account: userCompany,
        } = tokenResult.claims || {};

        const shouldAllowAccess = isRazAdmin || (userCompany && `/${userCompany}` === currentHref);

        if (!shouldAllowAccess) {
          window.location.href = "/login";
        }
      });
    }
  }, [user, loading]);

  // dont allow user to chat if not logged in
  useEffect(() => {
    if (!user && !loading) {
      window.location.href = "/login";
    }
    if (user) {
      console.log("gonnal get token");

      user.getIdToken().then((token) => {
        setToken(token);
      });
    }
  });

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

  const toggleAvail = async () => {
    let tok = await user?.getIdToken(true);

    setUserStatus(userStatus === "here" ? "away" : "here");

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
    let toggleRes = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/toggleAvail",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: tok!,
        },
        body: JSON.stringify({
          userAvailable: userStatus === "away",
        }),
      }
    );
    let toggleResJson = await toggleRes.json();
    if (toggleResJson.online == true) {
      setUserStatus("here");
    } else {
      setUserStatus("away");
    }
    console.log(toggleResJson);
  };

  const handleSendMessage = async (
    message: string,
    isCheckboxChecked: boolean,
    scheduledTime?: Date
  ) => {
    if (scheduledTime == undefined) {
      const optimisticMessage: MessageInterface = {
        content: message,
        role: "assistant",
        timestamp: new Date(),
        sent_by: "?",
      };
      console.log("opt");
      console.log(optimisticMessage);
      setLocalMessages(optimisticMessage);
    }

    // Logic to send message
    console.log(
      `Sending message: ${message} to conversation ${selectedConversationId}`
    );
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
          uid: selectedOption,
        }),
      }
    );
    console.log("market here");
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
        igDM: igDM,
      }),
    });
    console.log("market there");

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
    console.log("IGGGGGHHHH");
  };

  const showOnlineUsers = async () => {
    setIsLoadingOnlineUsers(true); // Start loading
    setShowModal(true); // Show the modal after fetching users
    setIsLoadingOnlineUsers(false); // Stop loading
  };

  return (
    <div className="flex dark:bg-[#1c1e20] dark:text-gray-300">
      <div style={{ width: "30%" }}>
        <div className="flex flex-col space-y-4 p-1">
          <div className="flex items-center">
            <SearchInput
              onSearch={handleSearch}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            <button
              className="ml-2 p-2 rounded  text-blackflex items-center justify-center"
              onClick={() => setDarkMode(!darkMode)}
            >
              <SunIcon className="h-6 w-6" />
            </button>
          </div>

          {/* <button
            className="bg-yellow-500 hover:bg-yellow-700 mt-2 text-white rounded p-2"
            onClick={toggleAvail}
          >
            {userStatus === "here" ? "Set as Away" : "Set as Here"}
          </button>
        */}
        </div>
        <div className="flex flex-col w-36">
          <FolderList onSelectFolder={handleSelectFolder} />
        </div>
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedDocumentId={selectedOption}
          conversationId={selectedConversationId!}
          admin={false}
          folder={selectedFolder}
          onListUpdated={restoreScrollPosition}
          aiCheckboxValue={false}
          userView={selectedSetter}
          setIGDM={setIgDM}
          igLead={igDM}
        />
      </div>
      <div style={{ width: "70%" }}>
        {selectedConversationId && (
          <>
            <MessageList
              conversationId={selectedConversationId}
              selectedDocumentId={selectedOption}
              setClaimer={setConvoClaimedBy}
              userView={selectedSetter}
              localMessages={localMessages}
              setLocalMessages={setLocalMessages}
              setIGDM={setIgDM}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              takeoverStatus={takeoverStatus}
              convoClaimedBy={convoClaimedBy}
              conversationId={selectedConversationId}
              selectedDocumentId={selectedOption}
            />
            <div className="flex justify-between">
              <MessageStatusButtons
                conversationId={selectedConversationId}
                selectedDocumentId={selectedOption}
                aiLead={aiLead}
                igLead={igDM}
              />
              {igDM && (
                <ZapButton
                  conversationId={selectedConversationId}
                  selectedDocumentId={selectedOption}
                  aiLead={aiLead}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
