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

const GOOGLE_MEET =
  "Do you want to hop on a Google Meet? Or a regular phone call? Would love to screenshare/show you how the mentorship works!";
const FREE_VM_LOCATION = "/output2.caf";
const ONEK_VM_LOCATION = "/1kvm.caf";
const OUT_OF_BUDGET =
  "If this is out of your budget, I have a 100% free side of the mentorship too! Can I get you started there?";
const TWOK_VM_LOCATION = "/2kvm.caf";
const CREATOR_VM_LOCATION = "/output1.caf";
const LINK_TO_1k =
  "https://drive.google.com/file/d/10sdCelfKBz2PiLnXtWe3g_8sYBBja36z/view?usp=sharing";
const LINK_TO_2k =
  "https://drive.google.com/file/d/1o24j3GaUiKLkdukRSFQmkFbwyfj64YcW/view?usp=drive_link";
const LINK_TO_COURSEFAM =
  "https://drive.google.com/file/d/1Y5SA7uPyUnc7WXbCFCUd2bgcV3oTK_yu/view?usp=drivesdk";
const COURSEFAM_VM_LOCATION = "/coursefam.caf";
const FIVE_HUNDRED_VM_LOCATION = "/500vm.caf";
const FREE_DISCORD_MSG =
  "Here's the link to join! https://discord.gg/ecomfamily\n\nIf you could join now that would be great! Let me know when you're in :call_me_hand::skin-tone-3:";
const DISCORD_MSG =
  "Ok sweet first step is joining our discord. https://discord.gg/ecomfamily";
const DO_YOU = "Do you have a second? I can get you onboarded right now!";
const LMK = "Lmk when you're in!";
const VOICEMEMO = "Hang on a sec gonna send you a voice memo...";
const COURSE_IDEA =
  "Do you already have a course idea in mind? Or would we need to brainstorm it out?";
const SHOPIFY = `Here’s the link for Shopify: https://shopify.pxf.io/c/3677228/1061744/13624

Once you create an account: you AREN’T done!

Select the Shopify Basic plan for 1$ and let me know once you completed that! Send a screenshot of your active plan :call_me_hand::skin-tone-2:
`;
const PHASE_ONE =
  "Ok phase one is complete you have a store. Let’s set you up and get this automated with a bunch of products. Sound good?";
const AUTO_DS = `Here’s the link for Auto DS! Let me know when that’s created!

https://platform.autods.com/register?ref=OTU1Njc3

Select the starter 200 plan! Screenshot me your active plan :call_me_hand::skin-tone-2:`;

const LAST_STEP = `Last step of the setup process! Here’s the link for Auto DS! Let me know when that’s created!

https://platform.autods.com/register?ref=OTU1Njc3

Select the starter 200 plan! Screenshot me your active plan :call_me_hand::skin-tone-2:
`;
const WHAT_DO_YOU_THINK = `What do you think?`;
const SCREENSHOT = `Send me a screenshot when you’re done so I know that you’re good`;
const FIRST_LAST = `What’s your first / last name btw? I’ll add you as a contact`;
const GIVE_LISTEN = `Awesome! Give this a listen and let me know if you’re in! Here’s some onboarding instructions / expectations`;

const TIKTOK = `Awesome! What's your TikTok @? I'll send you a voice message explaining what we need right now`;
const FIVEMORE = `My brands are looking to add 5 more content creators today to send all of there products over to for free. And again we just ask you to help with shipping. Would you want to be one of them?`;
const TWOSPOTS = `I just checked and we still have 2 spots left!`;
const DO_YOU_WANT = `Do you want one of them?`;

const ONESPOT = `I just checked and we still have 1 spot left!`;
const LAST_SPOT = `Do you want the last spot?`;
const LINK_TO_JOIN = `Here's the link to join: https://ecomfamily.org/products/tt-shop-creator-community-1?utm_content=ios&utm_medium=product-links&utm_source=copyToPasteboard

Go add this to your cart & checkout! I'm ready to get you onboarded with some products right now!`;
const PAID_VOICE =
  "I’ll send a voice message explaining how this mentorship works right now! Give it a listen and let me know what you think ASAP!";
const HOWS_DAY = `How's your day going?`;
const idToAliasMapping = {
  qh5ccjNAygXRam0Yui4E: "Ecomfamily",

  // Add more mappings if necessary
};
const options = Object.entries(idToAliasMapping).map(([id, alias]) => ({
  value: id,
  label: alias,
}));

export default function EcomFamily() {
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
  const [populateMessage, setPopulateMessage] = useState("");

  const refreshUsers = async () => {
    await getOnlineUsers();
  };

  useEffect(() => {
    if (docvalue) {
      console.log("hmm");
      console.log(docvalue);
      if (docvalue?.avail_now) {
        getOnlineUsers();
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
        getOnlineUsers();

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

        const fetchUserStatus = async () => {
          try {
            const response = await fetch(
              process.env.NEXT_PUBLIC_URL + "/api/checkAvail",
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
            console.log("checking");
            const data = await response.json();
            console.log(data);
            setUserStatus(data.message); // Assuming the API returns an object with the isHere boolean
            console.log(data.message);
          } catch (error) {
            console.error("Failed to fetch user status:", error);
          }
        };

        fetchUserStatus();
      });
    }
  }, [user]);

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

  const getOnlineUsers = async () => {
    let tok = await user?.getIdToken(true);
    console.log("wut");
    let onlineResult = await fetch(
      process.env.NEXT_PUBLIC_URL + `/api/checkAvail?uid=${selectedOption}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: tok!,
        },
      }
    );
    const data = await onlineResult.json();
    setOnlineUsers(data.availNow || []); // Assuming API returns an array of user IDs in availNow

    //set all users by looping through data.availNow
    let allUsers = [{ name: "All users", id: "All users" }];
    for (let i = 0; i < data.availNow.length; i++) {
      allUsers.push(data.availNow[i]);
      console.log(data.availNow[i].id);
    }
    //allUsers.push({ name: "Yoon", id: CONSTANTS.VA_IG_ID });
    setAllUsers(allUsers);
    console.log(allUsers);
  };

  const handleSendMessage = async (
    message: string,
    isCheckboxChecked: boolean,
    scheduledTime?: Date,
    messageIsMedia?: boolean
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
        message_is_media: messageIsMedia,
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
    await getOnlineUsers(); // This fetches the online users and updates state
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

          <div className="flex items-center">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Status:
              </span>
              <OnlineToggle toggleFn={toggleAvail} userStatus={userStatus} />
            </div>

            <button
              className="ml-4 bg-gray-500 hover:bg-gray-700 text-white dark:text-[#c4c3c0] rounded p-2"
              onClick={showOnlineUsers}
              disabled={isLoadingOnlineUsers}
            >
              {isLoadingOnlineUsers ? "Loading..." : "Who's online"}
            </button>
          </div>
          {/* <button
            className="bg-yellow-500 hover:bg-yellow-700 mt-2 text-white rounded p-2"
            onClick={toggleAvail}
          >
            {userStatus === "here" ? "Set as Away" : "Set as Here"}
          </button>
        */}
          <OnlineModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onlineUsers={onlineUsers}
            refreshUsers={refreshUsers}
            selectedDocumentId={selectedOption}
          />
        </div>
        <div className="flex flex-col w-36">
          <FolderList onSelectFolder={handleSelectFolder} />
          {(user?.uid === CONSTANTS.BRANDONP_ID ||
            user?.uid === CONSTANTS.ROB_REAL_ID ||
            user?.uid == CONSTANTS.ZACH_ECOM_ID ||
            user?.uid == CONSTANTS.LOGAN_ID) && (
            <SetterList
              setters={allUsers}
              onSelectFolder={handleSelectSetter}
            />
          )}
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
              populateMessage={populateMessage}
            />
            <MessageStatusButtons
              conversationId={selectedConversationId}
              selectedDocumentId={selectedOption}
              aiLead={aiLead}
              igLead={igDM}
            />
            <div className="text-xl font-bold mt-4">Free Script Shortcuts</div>
            <button
              onClick={() => setPopulateMessage(DO_YOU)}
              className=" bg-orange-500 mt-2 text-white rounded p-2"
            >
              Do you
            </button>
            <button
              onClick={() => setPopulateMessage(FREE_DISCORD_MSG)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Discord
            </button>
            <button
              onClick={() => setPopulateMessage(LMK)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Lmk
            </button>
            <button
              onClick={() =>
                handleSendMessage(FREE_VM_LOCATION, false, undefined, true)
              }
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Voice memo
            </button>
            <button
              onClick={() => setPopulateMessage(SHOPIFY)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Shopify
            </button>
            <button
              onClick={() => setPopulateMessage(AUTO_DS)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Auto DS
            </button>
            <button
              onClick={() => setPopulateMessage(FIRST_LAST)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              First/Last
            </button>
            <button
              onClick={() => setPopulateMessage(GIVE_LISTEN)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Give this a listen
            </button>

            <div className="text-xl font-bold mt-4">Creator Shortcuts</div>
            <button
              onClick={() => setPopulateMessage(TIKTOK)}
              className="  bg-orange-500 mt-2 text-white rounded p-2"
            >
              TikTok @
            </button>
            <button
              onClick={() =>
                handleSendMessage(CREATOR_VM_LOCATION, false, undefined, true)
              }
              className="  ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Voice memo
            </button>
            <button
              onClick={() => setPopulateMessage(FIVEMORE)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              5 More
            </button>
            <button
              onClick={() => setPopulateMessage(TWOSPOTS)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              2 Spots Left
            </button>
            <button
              onClick={() => setPopulateMessage(DO_YOU_WANT)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Do you want
            </button>
            <button
              onClick={() => setPopulateMessage(ONESPOT)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              1 Spot Left
            </button>
            <button
              onClick={() => setPopulateMessage(LAST_SPOT)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Last Spot
            </button>
            <button
              onClick={() => setPopulateMessage(LINK_TO_JOIN)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Link
            </button>
            <div className="text-xl font-bold mt-4">Paid Shortcuts</div>
            <button
              onClick={() => setPopulateMessage(HOWS_DAY)}
              className=" bg-orange-500 mt-2 text-white rounded p-2"
            >
              Day
            </button>
            <button
              onClick={() => setPopulateMessage(PAID_VOICE)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Will send VM
            </button>

            <button
              onClick={() =>
                handleSendMessage(ONEK_VM_LOCATION, false, undefined, true)
              }
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              $1000 VM
            </button>
            <button
              onClick={() => setPopulateMessage(LINK_TO_1k)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              $1k Gdrive
            </button>
            <button
              onClick={() =>
                handleSendMessage(TWOK_VM_LOCATION, false, undefined, true)
              }
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              $2000 VM
            </button>
            <button
              onClick={() => setPopulateMessage(LINK_TO_2k)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              $2k GDrive
            </button>
            <button
              onClick={() => setPopulateMessage(WHAT_DO_YOU_THINK)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              What do you think?
            </button>
            <button
              onClick={() => setPopulateMessage(GOOGLE_MEET)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Google Meet?
            </button>
            <button
              onClick={() => setPopulateMessage(OUT_OF_BUDGET)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Out of Budget
            </button>
            <div className="text-xl font-bold mt-4">Course Family</div>
            <button
              onClick={() =>
                handleSendMessage(COURSEFAM_VM_LOCATION, false, undefined, true)
              }
              className=" bg-orange-500 mt-2 text-white rounded p-2"
            >
              Voice Memo
            </button>
            <button
              onClick={() => setPopulateMessage(LINK_TO_COURSEFAM)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              GDrive Voice memo
            </button>
            <button
              onClick={() => setPopulateMessage(COURSE_IDEA)}
              className=" ml-5 bg-orange-500 mt-2 text-white rounded p-2"
            >
              Course Idea
            </button>
          </>
        )}
      </div>
    </div>
  );
}
