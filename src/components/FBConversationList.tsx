import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase_config";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Toaster, toast } from "react-hot-toast";
import { text } from "stream/consumers";
import { signOut } from "@firebase/auth";

interface Conversation {
  id: string;
  lead_name: string;
  summary: string;
  takeover: boolean;
}

interface ConversationListProps {
  onSelectConversation: (id: string, takeover: boolean) => void;
  selectedDocumentId: string; // Prop to receive the selected document ID
  accessToken: string;
  pageId: string;
}

const FBConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedDocumentId,
  accessToken,
  pageId,

  // Use the selected document ID in your component
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [textValue, setTextValue] = useState("");
  const [user, loading] = useAuthState(auth);

  const notify = () =>
    toast.success(
      "This prompt will be used to direct conversations from now on."
    );

  useEffect(() => {
    // Use the selectedDocumentId in your query
    console.log(selectedDocumentId);
    const q = query(
      collection(
        db,
        "users",
        "jw4wwo7gu6ZEKTNmTYEs8nhtIvJ2",
        "pages",
        selectedDocumentId,
        "convos"
      ),
      orderBy("last_updated", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cities: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        cities.push({ ...(doc.data() as Conversation), id: doc.id });
      });
      console.log(cities);
      setConversations(cities);
    });
    if (user) {
      const aa = getDoc(
        user! &&
          doc(
            db,
            "users",
            "jw4wwo7gu6ZEKTNmTYEs8nhtIvJ2",
            "pages",
            selectedDocumentId
          )
      ).then((doc) => {
        if (doc.exists()) {
          setTextValue(doc.data().prompt);
        } else {
          // doc.data() will be undefined in this case
          console.log("No prompt");
        }
      });
    }

    return () => unsubscribe();
  }, [selectedDocumentId]); // Add selectedDocumentId as a dependency

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(event.target.value);
  };
  const handleSave = async () => {
    console.log(textValue);
    console.log(selectedDocumentId);
    if (!textValue) return; // Prevent saving empty string
    let uid = user!.uid;
    try {
      await updateDoc(doc(db, "users", uid, "pages", selectedDocumentId), {
        prompt: textValue,
      });
      console.log("Data saved successfully");
      notify();
    } catch (error) {
      console.error("Error saving data: ", error);
    }
  };

  return (
    <div>
      {conversations.length == 0 && (
        <p className="ml-2 mt-2">No current conversations</p>
      )}
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => {
            onSelectConversation(conversation.id, conversation.takeover);
            console.log(conversation);
          }}
          className="cursor-pointer p-2 hover:bg-gray-100"
        >
          <div className="font-bold">
            {conversation.lead_name} ({conversation.id})
          </div>
          {/* You can also display the summary if needed */}
        </div>
      ))}
      <div className="p-2">
        <textarea
          value={textValue}
          onChange={handleTextChange}
          className="w-full p-2 border"
          rows={3}
          placeholder="AI Prompt to use..."
        />
        <div className="flex flex-col w-24">
          <button
            onClick={handleSave}
            className="mt-2 p-2 bg-blue-500 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={() => signOut(auth)}
            className="mt-2 p-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
        <Toaster />
      </div>
    </div>
  );
};

export default FBConversationList;
