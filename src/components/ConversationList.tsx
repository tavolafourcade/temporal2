import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
  Timestamp,
  CollectionReference,
  QueryConstraint,
  DocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { User, signOut } from "@firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

import * as CONSTANTS from "../../constants";
import { auth, db } from "../../firebase_config";
import { useScrollPosition } from "../components/ScrollPositionProvider";

const DEFAULT_LAST_UPDATED_VALUES = {
  "24-hours": new Date(Date.now() - 24 * 60 * 60 * 1000),
  "72-hours": new Date(Date.now() - 72 * 60 * 60 * 1000),
  "2-weeks": new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
};

type LastUpdatedValues = "24-hours" | "72-hours" | "2-weeks";

interface Conversation {
  id: string;
  lead_name: string;
  summary: string;
  takeover: boolean;
  final_nudge: boolean;
  all_messages_read: boolean;
  claimed_by: string;
  timestamps: any[];
  messages: any[];
  last_updated: Timestamp;
  marked_starred?: boolean;
}

export interface InstagramSettings {
  instagramId: string;
  instagramPageId: string;
}

export const emptyInstagramSettings: InstagramSettings = {
  instagramId: "",
  instagramPageId: "",
};

interface ConversationListProps {
  onSelectConversation: (id: string, takeover: boolean, nudge: boolean) => void;
  selectedDocumentId: string; // Prop to receive the selected document ID
  conversationId: string;
  admin?: boolean;
  folder: string;
  onListUpdated: () => void;
  aiCheckboxValue?: boolean;
  userView?: string;
  setIGDM?: (state: boolean) => void;
  igLead: boolean;
  isDemo?: boolean;
  queryParamCompanyOverride?: string | null;
}

const sortConversations = (a: Conversation, b: Conversation) => {
  // Prioritize marked_starred and unread
  if (
    a.marked_starred &&
    !a.all_messages_read &&
    (!b.marked_starred || b.all_messages_read)
  )
    return -1;
  if (
    b.marked_starred &&
    !b.all_messages_read &&
    (!a.marked_starred || a.all_messages_read)
  )
    return 1;

  // Next, prioritize other marked_starred conversations
  if (a.marked_starred && !b.marked_starred) return -1;
  if (b.marked_starred && !a.marked_starred) return 1;

  // Then, prioritize unread conversations
  if (!a.all_messages_read && b.all_messages_read) return -1;
  if (!b.all_messages_read && a.all_messages_read) return 1;

  // Lastly, sort by last_updated or any other criteria you prefer
  return b.last_updated.toMillis() - a.last_updated.toMillis();
};

export const getCompanyOverrideData = (
  user: User,
  apiKey: string,
  companyOverride: string,
  isCompanyName: boolean = false
) => {
  return user.getIdToken(true).then((token) => {
    return fetch(process.env.NEXT_PUBLIC_URL + "/api/override_company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: token,
      },
      body: JSON.stringify({
        override_company: companyOverride,
        is_company_name: isCompanyName,
      }),
    });
  });
};

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedDocumentId,
  conversationId,
  folder,
  onListUpdated,
  userView,
  igLead,
  isDemo = false,
  queryParamCompanyOverride = null,
}) => {
  const [user, loading] = useAuthState(auth);
  const { setScrollPosition } = useScrollPosition();

  const [time, setTime] = useState<Date>(new Date());
  const [token, setToken] = useState("");
  const [userClaims, setUserClaims] = useState<any>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [instagramSettings, setInstagramSettings] = useState<InstagramSettings>(
    emptyInstagramSettings
  );
  const [currentQuery, setCurrentQuery] = useState({
    claimed_by: null,
    marked_dq: false,
    marked_live: false,
    marked_favorite: false,
    marked_completed: false,
    last_updated: DEFAULT_LAST_UPDATED_VALUES["2-weeks"],
  });

  const listRef = useRef<HTMLDivElement | null>(null);
  const conversationsMap = useRef(new Map());
  const prevConversationsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    const intervalId = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(intervalId);
  }, []);

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
    onListUpdated();
  }, [conversations]);

  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) setScrollPosition(listRef.current.scrollTop);
    };

    const listElement = listRef.current;
    listElement?.addEventListener("scroll", handleScroll);

    return () => listElement?.removeEventListener("scroll", handleScroll);
  }, [setScrollPosition]);

  // Query Update Effects
  useEffect(() => {
    // marked_favorite
    const effectConditions: any = {};
    effectConditions["marked_favorite"] = folder === "Favorites" || null;

    setCurrentQuery((currentQuery) =>
      Object.assign({}, currentQuery, effectConditions)
    );
  }, [folder]);

  useEffect(() => {
    // marked_completed
    const { isAdmin, isManager } = userClaims;
    const hasAdminPermission = isAdmin || isManager;

    const effectConditions: any = {};

    const shouldBeTrue = folder === "Completed";

    const shouldBeFalse =
      folder === "Favorites" ||
      (hasAdminPermission &&
        (folder === "Active" ||
          (folder === "Live" && userView !== "All users"))) ||
      (!hasAdminPermission && (folder === "All" || folder === "Live"));

    effectConditions["marked_completed"] = shouldBeTrue && !shouldBeFalse;

    setCurrentQuery((currentQuery) =>
      Object.assign({}, currentQuery, effectConditions)
    );
  }, [folder, userClaims, userView]);

  useEffect(() => {
    // marked_dq
    const { isAdmin, isManager } = userClaims;
    const hasAdminPermission = isAdmin || isManager;

    const effectConditions: any = {};

    const shouldBeTrue =
      folder === "NGMI" &&
      (!hasAdminPermission || (hasAdminPermission && userView === "All users"));

    const shouldBeFalse =
      folder === "Favorites" ||
      (hasAdminPermission && folder === "Active") ||
      (!hasAdminPermission && folder === "All");

    effectConditions["marked_dq"] = shouldBeTrue && !shouldBeFalse;

    setCurrentQuery((currentQuery) =>
      Object.assign({}, currentQuery, effectConditions)
    );
  }, [folder, userClaims, userView]);

  useEffect(() => {
    // marked_live
    const { isAdmin, isManager } = userClaims;
    const hasAdminPermission = isAdmin || isManager;

    const effectConditions: any = {};

    const shouldBeTrue =
      folder === "Live" &&
      (!hasAdminPermission || (hasAdminPermission && userView !== "All users"));
    effectConditions["marked_live"] = shouldBeTrue || null;

    setCurrentQuery((currentQuery) =>
      Object.assign({}, currentQuery, effectConditions)
    );
  }, [folder, userClaims, userView]);

  useEffect(() => {
    // claimed_by
    const effectConditions: any = {};

    const { isAdmin, isManager, viewPermissions = {} } = userClaims;
    const hasAdminPermission = isAdmin || isManager;
    const { notSeventyTwoHoursRangeForNotAdmin = false } = viewPermissions;

    const shouldBeAllUsers = hasAdminPermission && userView !== "All users";
    const shouldBeCurrentUser = !hasAdminPermission;

    effectConditions["claimed_by"] =
      (shouldBeAllUsers && userView) ||
      (shouldBeCurrentUser && user?.uid) ||
      null;

    setCurrentQuery((currentQuery) =>
      Object.assign({}, currentQuery, effectConditions)
    );
  }, [folder, user, userClaims, userView]);

  useEffect(() => {
    // disqualified
    const { isAdmin, isManager } = userClaims;
    const hasAdminPermission = isAdmin || isManager;

    const effectConditions: any = {};

    const shouldBeTrue =
      hasAdminPermission && folder === "NGMI" && userView !== "All users";
    effectConditions["disqualified"] = shouldBeTrue || null;

    setCurrentQuery((currentQuery) =>
      Object.assign({}, currentQuery, effectConditions)
    );
  }, [folder, userClaims, userView]);

  useEffect(() => {
    // last_updated
    const effectConditions: any = {};

    const {
      isAdmin = false,
      isManager = false,
      isRazAdmin = false,
      viewPermissions = {},
    } = userClaims;

    const {
      twoWeeksRangeForViewAllUsers = false,
      twoWeeksRangeForViewNotAllUsers = false,
      notSeventyTwoHoursRangeForNotAdmin = false,
    } = viewPermissions;

    const hasAdminPermission = isAdmin || isManager;

    const shouldBeTwentyFourHours =
      (!hasAdminPermission && (folder === "All" || userView === "All users")) ||
      (hasAdminPermission &&
        folder === "Active" &&
        !twoWeeksRangeForViewAllUsers);

    const shouldBeSeventyTwoHours =
      (hasAdminPermission &&
        (folder === "NGMI" ||
          folder === "Favorites" ||
          folder === "Completed" ||
          ((folder === "Active" || folder === "Live") &&
            userView !== "All users") ||
          ((folder === "All" ||
            (folder === "Live" && userView === "All users")) &&
            !isRazAdmin))) ||
      (!hasAdminPermission &&
        ((folder === "Active" && !notSeventyTwoHoursRangeForNotAdmin) ||
          (folder !== "Active" && !twoWeeksRangeForViewNotAllUsers)));

    const shouldBeTwoWeeks =
      hasAdminPermission &&
      ((folder === "Active" &&
        ((userView === "All users" && twoWeeksRangeForViewAllUsers) ||
          (userView !== "All users" && twoWeeksRangeForViewNotAllUsers))) ||
        ((folder === "All" ||
          (folder === "Live" && userView === "All users")) &&
          isRazAdmin) ||
        (folder !== "All" && twoWeeksRangeForViewNotAllUsers));

    const lastUpdatedIndex: LastUpdatedValues =
      (shouldBeTwoWeeks && "2-weeks") ||
      (shouldBeSeventyTwoHours && "72-hours") ||
      (shouldBeTwentyFourHours && "24-hours") ||
      "";

    if (lastUpdatedIndex && lastUpdatedIndex.length > 0) {
      effectConditions["last_updated"] =
        DEFAULT_LAST_UPDATED_VALUES[lastUpdatedIndex];
      setCurrentQuery((currentQuery) =>
        Object.assign({}, currentQuery, effectConditions)
      );
    }
  }, [folder, userClaims, userView]);

  useEffect(() => {
    if (!user) return;

    const { isAdmin, isManager } = userClaims;
    const hasAdminPermission = isAdmin || isManager;

    const collectionPath = collection(
      db,
      "users",
      selectedDocumentId,
      "convos"
    );
    console.log({ collectionPath });
    const hasInstagram =
      !isDemo &&
      instagramSettings &&
      instagramSettings.instagramId &&
      instagramSettings.instagramId.length > 0;

    const queryParser = (currentQuery: any) => {
      if (isDemo) return [];

      return Object.keys(currentQuery)
        .filter((queryElement) => currentQuery[queryElement] !== null)
        .map((queryElement) => {
          console.log('queryElement ----->', queryElement)
          const comparer = queryElement === "last_updated" ? ">" : "==";
          console.log(
            `WHERE CLAUSE: ${queryElement} ${comparer} ${currentQuery[queryElement]}`
          );

          return where(queryElement, comparer, currentQuery[queryElement]);
        });
    };

    const queryPath = [
      ...queryParser(currentQuery),
      orderBy("last_updated", "desc"),
    ];
    console.log('queryPath ---------->', queryPath );

    const mainQuery = [collectionPath, ...queryPath];
    const q = query(
      ...(mainQuery as [CollectionReference, ...QueryConstraint[]])
    );

    const handleSnapshot = (snapshot: any, source: string) => {
      console.log("snapshot ---------->", snapshot.docs);

      const sourceKeys = new Set(
        Array.from(conversationsMap.current.entries())
          .filter(([_, value]) => value.source === source)
          .map(([key, _]) => key)
      );
      console.log({sourceKeys})
      snapshot.docs.forEach((doc: DocumentSnapshot) => {
        conversationsMap.current.set(doc.id, {
          ...(doc.data() as Conversation),
          id: doc.id,
          source,
        });

        sourceKeys.delete(doc.id);
        const prevConvo = prevConversationsRef.current.find(
          (prev) => prev.id === doc.id
        );

        if (
          (!hasAdminPermission ||
            (user?.uid == CONSTANTS.JOEY_ID &&
              prevConvo?.claimed_by == CONSTANTS.JOEY_ID)) &&
          !(user?.uid == CONSTANTS.JACOB_ID) &&
          prevConvo &&
          prevConvo.all_messages_read &&
          !doc.data()!.all_messages_read
        ) {
          playDingSound();
        }
      });

      sourceKeys.forEach((key) => {
        conversationsMap.current.delete(key);
      });

      updateConversations();
    };

    const updateConversations = () => {
      const combinedConversations = Array.from(
        conversationsMap.current.values()
      );
      console.log('combinedConversations -------->', combinedConversations)
      prevConversationsRef.current = combinedConversations;
      combinedConversations.sort(sortConversations);
      setConversations(combinedConversations);
    };

    const unsubscribeRegular = onSnapshot(q, (snapshot) =>
      handleSnapshot(snapshot, "text")
    );

    let unsubscribeIg: Unsubscribe;

    if (hasInstagram) {
      const newCollection = collection(
        db,
        "users",
        instagramSettings.instagramId,
        "pages",
        instagramSettings.instagramPageId,
        "convos"
      );

      const instagramQueryPath = [newCollection, ...queryPath];
      const r = query(
        ...(instagramQueryPath as [CollectionReference, ...QueryConstraint[]])
      );

      unsubscribeIg = onSnapshot(r, (snapshot) =>
        handleSnapshot(snapshot, "IG")
      );
    }

    return () => {
      unsubscribeRegular();
      if (hasInstagram) unsubscribeIg();
    };
  }, [
    isDemo,
    selectedDocumentId,
    currentQuery,
    user,
    userClaims,
    instagramSettings,
  ]);

  const playDingSound = () => {
    const audio = new Audio("/click_sound.mp3");
    audio.play();
  };

  const toggleStar = async (
    conversationId: string,
    isCurrentlyStarred: boolean
  ) => {
    const { apiKey } = userClaims;
    const token = (await user?.getIdToken(true)) || "";

    const res = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/update_convo_status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          Authorization: token,
        },
        body: JSON.stringify({
          lead_phone: conversationId,
          doc_id: selectedDocumentId,
          lead_status: isCurrentlyStarred ? "starred" : "undo_starred",
          ig_lead: igLead,
        }),
      }
    );
    console.log('res------->', res)
    if (res.ok) {
      setConversations((prevConversations) => {
        return prevConversations
          .map((conversation) => {
            return conversation.id === conversationId
              ? { ...conversation, marked_starred: isCurrentlyStarred }
              : conversation;
          })
          .sort(sortConversations);
      });
    }
  };

  // Function to calculate time difference and format it
  const getTimeDifference = (lastUpdateTime: Timestamp) => {
    const now = new Date() as any;
    const lastUpdate = new Date(lastUpdateTime.toDate()) as any;
    const differenceInSeconds = Math.floor((now - lastUpdate) / 1000);

    const minutes = Math.floor(differenceInSeconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return `${minutes > 0 ? minutes : 1} minute${minutes > 1 ? "s" : ""} ago`;
    }
  };

  // Function to get color based on time difference
  const getColorForTimeDifference = (lastUpdateTime: Timestamp) => {
    const now = new Date() as any;
    const lastUpdate = new Date(lastUpdateTime.toDate()) as any;
    const differenceInMinutes = Math.floor((now - lastUpdate) / 60000);

    if (differenceInMinutes <= 20) {
      return "text-green-600"; // light green for within 20 min
    } else if (differenceInMinutes <= 60) {
      return "text-yellow-500"; // yellow for 21 min to 1hr
    } else if (differenceInMinutes <= 180) {
      return "text-orange-500"; // orange for 1hr 1min to 3hrs
    } else {
      return "text-red-600"; // red for 3hrs 1min+
    }
  };

  return (
    <div
      id="conversation-list-id"
      ref={listRef}
      style={{ maxHeight: "calc(100vh - 20px)", overflowY: "auto" }}
    >
      {conversations.map((conversation) => {
        const isPrioritized = !conversation.all_messages_read;
        const colorClass = isPrioritized
          ? getColorForTimeDifference(
              conversation.messages.length > 0
                ? conversation.timestamps[conversation.timestamps.length - 1]
                : conversation.last_updated
            )
          : "text-black dark:text-[#c4c3c0]";

        return (
          <div
            key={conversation.id}
            onClick={() => {
              onSelectConversation(
                conversation.id,
                conversation.takeover,
                conversation.final_nudge
              );
            }}
            className={`group conversation-item dark:text-[#c4c3c0]  flex justify-between cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-black ${
              conversationId == conversation.id &&
              "bg-gray-300 dark:bg-gray-800"
            }`}
          >
            <div className={`font-bold ${!conversation.all_messages_read}`}>
              <div>
                {conversation.lead_name} ({conversation.id})
              </div>
              <div className="overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[250px]">
                {conversation.messages.length > 0
                  ? conversation.messages[conversation.messages.length - 1]
                      .content.length > 75
                    ? conversation.messages[
                        conversation.messages.length - 1
                      ].content.substring(0, 75) + "..."
                    : conversation.messages[conversation.messages.length - 1]
                        .content
                  : "New lead"}
              </div>
              <div className={`${colorClass}`}>
                {conversation.messages.length > 0
                  ? getTimeDifference(
                      conversation.timestamps[
                        conversation.timestamps.length - 1
                      ]
                    )
                  : getTimeDifference(conversation.last_updated)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(conversation.id, !conversation.marked_starred);
              }}
              className={`star-btn ${
                conversation.marked_starred
                  ? "text-yellow-400"
                  : "text-gray-400 opacity-0"
              }  group-hover:opacity-100 hover:text-yellow-400`}
            >
              {conversation.marked_starred ? "★" : "☆"}
            </button>
          </div>
        );
      })}
      <button
        onClick={() => signOut(auth)}
        className="mt-2 p-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default ConversationList;
