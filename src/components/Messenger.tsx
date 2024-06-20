import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

import * as CONSTANTS from "../../constants";
import { auth, db } from "../../firebase_config";
import { SunIcon } from "@heroicons/react/24/outline";

import SearchInput from "@/components/SearchInput";
import { useScrollPosition } from "@/components/ScrollPositionProvider";
import FolderList from "@/components/FolderList";
import ConversationList from "@/components/ConversationList";
import MessageList, { MessageInterface } from "@/components/MessageList";
import MessageInput from "@/components/MessageInputs";
import MessageStatusButtons from "@/components/StatusButtons";

interface MessengerProps {
  isDemo?: boolean;
}

const Messenger: React.FC<MessengerProps> = ({ isDemo = false }) => {
  const [user, loading] = useAuthState(auth);
  const { scrollPosition } = useScrollPosition();

  const [igDM, setIgDM] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [takeoverStatus, setTakeoverStatus] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>("null");
  const [selectedSetter, setSelectedSetter] = useState<string>("All users");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [localMessages, setLocalMessages] = useState<MessageInterface>(
    {} as MessageInterface
  );
  const [selectedFolder, setSelectedFolder] = useState<string>("Active");
  const [companyOverride, setCompanyOverride] = useState<string | null>(null);

  // @TODO define types
  const [userClaims, setUserClaims] = useState<any>({});
  const [convoClaimedBy, setConvoClaimedBy] = useState<any>("");

  // @TODO delete?
  const [aiLead, setAiLead] = useState(false);
  const [token, setToken] = useState("");
  const [userStatus, setUserStatus] = useState("here");
  const [nudgeStatus, setNudgeStatus] = useState(false);
  const [promptManagerActive, setPromptManagerActive] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]); // New state to store online users
  const [showModal, setShowModal] = useState(false);
  const [isLoadingOnlineUsers, setIsLoadingOnlineUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([
    { name: "All users", id: "All users" },
  ]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      return () => document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    if (!user && !loading) window.location.href = "/login";

    if (user) {
      user.getIdToken().then((token) => setToken(token));
      user.getIdTokenResult(true).then((tokenResult) => {
        const { companyId, isRazAdmin = false } = tokenResult.claims;

        const currentPathSearch = window.location.search;
        const hasQueryString =
          currentPathSearch && currentPathSearch.length > 0;
        const queryString = hasQueryString
          ? window.location.search.split("=")
          : null;
        const companyOverride =
          queryString && queryString[0] === "?company" ? queryString[1] : false;

        if (isRazAdmin && companyOverride) {
          setCompanyOverride(companyOverride);
        }

        const optionToSelect =
          (isRazAdmin && companyOverride) ||
          (isDemo && CONSTANTS.FT_TRADER_ID) ||
          companyId;

        setUserClaims(tokenResult.claims);
        setSelectedOption(`${optionToSelect}`);
      });
    }
  }, [isDemo, user, loading]);

  const restoreScrollPosition = () => {
    const conversationList = document.getElementById("conversation-list-id");
    if (conversationList) conversationList.scrollTop = scrollPosition;
  };

  const handleSearch = async (searchTerm: any) => {
    // @TODO refactor into real-time searching
    if (!searchTerm.includes("+")) searchTerm = "+" + searchTerm;

    const docRes = await getDoc(
      doc(db, "users", selectedOption!, "convos", searchTerm!)
    );

    if (docRes.exists()) setSelectedConversationId(searchTerm);
  };

  const handleSelectConversation = (
    id: string,
    takeover: boolean,
    nudge: boolean
  ) => {
    setSelectedConversationId(id);

    setTakeoverStatus(takeover);
    setNudgeStatus(nudge);
  };

  const handleSendMessage = async (
    message: string,
    isCheckboxChecked: boolean,
    scheduledTime?: Date
  ) => {
    if (!scheduledTime) {
      const optimisticMessage: MessageInterface = {
        content: message,
        role: "assistant",
        timestamp: new Date(),
        sent_by: "?",
      };

      setLocalMessages(optimisticMessage);
    }

    console.log(
      `Sending message: ${message} to conversation ${selectedConversationId}`
    );
    const userToken = await user?.getIdToken(true);
    const apiKey = userClaims?.apiKey;

    await fetch(process.env.NEXT_PUBLIC_URL + "/api/authed_follow_up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: userToken!,
      },
      body: JSON.stringify({
        igDM: igDM,
        message: message,
        takeover: isCheckboxChecked,
        scheduled_time: scheduledTime,
        lead_phone: selectedConversationId,
        company_override: companyOverride,
      }),
    });

    if (!convoClaimedBy || convoClaimedBy == user?.uid) {
      await fetch(process.env.NEXT_PUBLIC_URL + "/api/update_read_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: userToken!,
        },
        body: JSON.stringify({
          read_status: true,
          lead_phone: selectedConversationId,
        }),
      });
    }
  };
  console.log({selectedOption})
  return (
    <div className="flex dark:bg-[#1c1e20] dark:text-gray-300">
      <div style={{ width: "30%" }}>
        <div className="flex ">
          <SearchInput
            onSearch={handleSearch}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          <button
            className="ml-2 text-center justify-center"
            onClick={() => setDarkMode(!darkMode)}
          >
            <SunIcon className="h-8 w-8 " />
          </button>
        </div>
        <div className="flex flex-col w-36">
          <FolderList onSelectFolder={setSelectedFolder} />
        </div>
    
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedDocumentId={selectedOption}
          conversationId={selectedConversationId!}
          folder={selectedFolder}
          onListUpdated={restoreScrollPosition}
          userView={selectedSetter}
          igLead={igDM}
          isDemo={isDemo}
          queryParamCompanyOverride={companyOverride}
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
              queryParamCompanyOverride={companyOverride}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              takeoverStatus={takeoverStatus}
              convoClaimedBy={convoClaimedBy}
              conversationId={selectedConversationId}
              selectedDocumentId={selectedOption}
            />

            <MessageStatusButtons
              conversationId={selectedConversationId}
              selectedDocumentId={selectedOption}
              aiLead={aiLead}
              igLead={igDM}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Messenger;
