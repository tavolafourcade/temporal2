import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase_config";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

import { Toaster, toast } from "react-hot-toast";

interface Conversation {
  id: string;
  lead_name: string;
  summary: string;
  takeover: boolean;
  final_nudge: boolean;
}

interface PromptManagerProps {
  //   onSelectConversation: (id: string, takeover: boolean, nudge: boolean) => void;
  selectedDocumentId: string; // Prop to receive the selected document ID
  //   conversationId: string;
}

const PromptManager: React.FC<PromptManagerProps> = ({
  //   onSelectConversation,
  selectedDocumentId, // Use the selected document ID in your component
  //   conversationId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [scriptValue, setScriptValue] = useState("");
  const [contextValue, setContextValue] = useState("");
  const [examplesValue, setExamplesValue] = useState("");
  const [user, loading] = useAuthState(auth);
  const [token, setToken] = useState("");
  const [liveCallsScriptValue, setLiveCallsScriptValue] = useState("");
  const [nonLiveCallsScriptValue, setNonLiveCallsScriptValue] = useState("");

  const [liveCallsExampleValue, setLiveCallsExampleValue] = useState("");
  const [nonLiveCallsExampleValue, setNonLiveCallsExampleValue] = useState("");

  const [showScriptTextAreas, setShowScriptTextAreas] = useState(false);
  const [showExampleTextAreas, setShowExampleTextAreas] = useState(false);

  const notify = () =>
    toast.success(
      "This prompt will be used to direct conversations from now on."
    );

  const handleSave = async () => {
    if (!scriptValue || !contextValue || !examplesValue) {
      toast.error("Please fill out all fields");
      return;
    } // Prevent saving empty string

    let scriptVarName = "";
    let exampleVarName = "";
    // want to search through scriptValue and find the variable name that is the text within brackets:  {{text}}
    // let's use regex to find the variable name
    const regex = /{{(.*?)}}/g;
    const matches = scriptValue.match(regex);
    if (matches) {
      scriptVarName = matches[0].replace(/{{|}}/g, "");
    }
    const exMatches = examplesValue.match(regex);
    if (exMatches) {
      exampleVarName = exMatches[0].replace(/{{|}}/g, "");
    }
    console.log(scriptVarName);

    try {
      await fetch(process.env.NEXT_PUBLIC_URL + "/api/save_prompt_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token!,
        },
        body: JSON.stringify({
          uid: selectedDocumentId,
          script: scriptValue,
          context: contextValue,
          examples: examplesValue,
          liveCallsScript: liveCallsScriptValue,
          nonLiveCallsScript: nonLiveCallsScriptValue,
          liveCallsExample: liveCallsExampleValue,
          nonLiveCallsExample: nonLiveCallsExampleValue,
          scriptVarName: scriptVarName,
          exampleVarName: exampleVarName,
        }),
      });

      console.log("Data saved successfully");
      notify();
    } catch (error) {
      console.error("Error saving data: ", error);
    }
  };

  useEffect(() => {
    if (!user && !loading) {
      window.location.href = "/login";
    }
    if (user) {
      user.getIdToken().then((token) => {
        setToken(token);
      });
      console.log(selectedDocumentId);
      const aa = getDoc(user && doc(db, "users", selectedDocumentId)).then(
        (doc) => {
          if (doc.exists()) {
            let docdata = doc.data();
            setScriptValue(docdata!.script || "");
            setContextValue(docdata!.context || "");
            setExamplesValue(docdata!.examples || "");

            setLiveCallsScriptValue(
              docdata!["script_" + docdata.script_varname + "_true"] || ""
            );
            setNonLiveCallsScriptValue(
              docdata!["script_" + docdata.script_varname + "_false"] || ""
            );

            setLiveCallsExampleValue(
              docdata!["examples_" + docdata.examples_varname + "_true"] || ""
            );
            setNonLiveCallsExampleValue(
              docdata!["examples_" + docdata.examples_varname + "_false"] || ""
            );
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        }
      );
    }
  }, [selectedDocumentId]); // Add selectedDocumentId as a dependency

  return (
    <div>
      <div className="mt-2">
        <h1 className="text-lg font-bold">Script</h1>
        <textarea
          value={scriptValue}
          onChange={(event) => setScriptValue(event.target.value)}
          className="w-full p-2 border"
          rows={3}
          placeholder="AI Prompt to use..."
        />
        {showScriptTextAreas && (
          <div className="flex mt-4 space-x-4">
            <div className="flex flex-col w-1/2">
              <h1 className="font-bold">Varible True</h1>
              <textarea
                className="p-2 border"
                rows={3}
                placeholder="Text Area 1"
                value={liveCallsScriptValue}
                onChange={(e) => setLiveCallsScriptValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-1/2">
              <h1 className="font-bold">Variable False</h1>
              <textarea
                className=" p-2 border"
                rows={3}
                placeholder="Text Area 2"
                value={nonLiveCallsScriptValue}
                onChange={(e) => setNonLiveCallsScriptValue(e.target.value)}
              />
            </div>
          </div>
        )}
        <button
          onClick={() => setShowScriptTextAreas(!showScriptTextAreas)}
          className="mt-4 p-2 rounded-full bg-blue-500 text-white"
          aria-label={
            showScriptTextAreas ? "Remove text areas" : "Add text areas"
          }
        >
          {" "}
          {showScriptTextAreas ? "- Boolean Var" : "+ Boolean Var"}{" "}
          {/* Plus or Minus Icon */}
        </button>
        <h1 className="text-lg font-bold">Context</h1>
        <textarea
          value={contextValue}
          onChange={(event) => setContextValue(event.target.value)}
          className="w-full p-2 border"
          rows={3}
          placeholder="AI Prompt to use..."
        />
        <h1 className="text-lg font-bold">Examples</h1>
        <textarea
          value={examplesValue}
          onChange={(event) => setExamplesValue(event.target.value)}
          className="w-full p-2 border"
          rows={3}
          placeholder="AI Prompt to use..."
        />
        {showExampleTextAreas && (
          <div className="flex mt-4 space-x-4">
            <div className="flex flex-col w-1/2">
              <h1 className="font-bold">Variable True</h1>
              <textarea
                className="p-2 border"
                rows={3}
                placeholder="Text Area 1"
                value={liveCallsExampleValue}
                onChange={(e) => setLiveCallsExampleValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col w-1/2">
              <h1 className="font-bold">Variable False</h1>
              <textarea
                className=" p-2 border"
                rows={3}
                placeholder="Text Area 2"
                value={nonLiveCallsExampleValue}
                onChange={(e) => setNonLiveCallsExampleValue(e.target.value)}
              />
            </div>
          </div>
        )}
        <button
          onClick={() => setShowExampleTextAreas(!showExampleTextAreas)}
          className="mt-4 p-2 rounded-full bg-blue-500 text-white"
          aria-label={
            showExampleTextAreas ? "Remove text areas" : "Add text areas"
          }
        >
          {" "}
          {showExampleTextAreas ? "- Boolean Var" : "+ Boolean Var"}{" "}
          {/* Plus or Minus Icon */}
        </button>
        <h1 className="text-lg font-bold"></h1>
        <button
          onClick={handleSave}
          className="mt-2 p-2 bg-blue-500 text-white rounded"
        >
          Save
        </button>
      </div>
      <Toaster />
    </div>
  );
};

export default PromptManager;
