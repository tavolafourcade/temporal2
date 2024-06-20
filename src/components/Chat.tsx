import { useEffect, useState } from "react";
import { Button } from "./Button";
import { type ChatGPTMessage, ChatLine, LoadingChatLine } from "./ChatLine";
import { useCookies } from "react-cookie";
import {
  defaultFirstMessage,
  getMainPrompt,
  getSystemMessage,
} from "../../utils/prompts";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase_config";

const COOKIE_NAME = "nextjs-example-ai-chat-gpt3";

const InputMessage = ({ input, setInput, sendMessage }: any) => (
  <div className="mt-6 flex clear-both">
    <>
      <input
        type="text"
        aria-label="chat input"
        required
        className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm"
        value={input}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage(input);
            setInput("");
          }
        }}
        onChange={(e) => {
          setInput(e.target.value);
        }}
      />
      <Button
        type="submit"
        className="ml-4 flex-none"
        onClick={() => {
          sendMessage(input);
          setInput("");
        }}
      >
        Say
      </Button>
    </>
  </div>
);

export function Chat({
  token,
  person,
  leadName,
  budget,
  meetingBooked,
}: {
  token: string;
  person: string;
  leadName: string;
  budget: number;
  meetingBooked: boolean;
}) {
  const retrieveData = async (
    person: string,
    leadName: string,
    budget: number,
    meetingBooked: boolean,
    token: string
  ) => {
    console.log(token);
    let resp = await fetch("/api/getPromptData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        leadName,
        person,
        budget,
        meetingBooked,
      }),
    });

    let sysMessage = "";
    let welcomeMessage = "";
    let mainPrompt = "";

    if (resp.status == 200) {
      let data = await resp.json();
      sysMessage = data.sysMessage;
      welcomeMessage = data.welcomeMessage;
      mainPrompt = data.mainPrompt;
    }

    setMessages([
      {
        role: "system",
        content: sysMessage,
      },
      {
        role: "user",
        content: mainPrompt,
      },
      {
        role: "assistant",
        content: welcomeMessage,
      },
    ]);
  };

  useEffect(() => {
    console.log(person);
    console.log(budget);
    console.log(meetingBooked);

    if (token != undefined) {
      console.log(token);
      retrieveData(person, leadName, budget, meetingBooked, token);
    }
  }, [person, leadName, budget, meetingBooked, token]);
  console.log(person);

  // default first message to display in UI (not necessary to define the prompt)
  //   const initialMessages: ChatGPTMessage[] = [
  //     {
  //       role: "system",
  //       content: sysMessage,
  //     },
  //     {
  //       role: "user",
  //       content: mainPrompt,
  //     },
  //     {
  //       role: "assistant",
  //       content: welcomeMessage,
  //     },
  //   ];

  const [messages, setMessages] = useState<ChatGPTMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cookie, setCookie] = useCookies([COOKIE_NAME]);

  useEffect(() => {
    if (!cookie[COOKIE_NAME]) {
      // generate a semi random short id
      const randomId = Math.random().toString(36).substring(7);
      setCookie(COOKIE_NAME, randomId);
    }
  }, [cookie, setCookie]);

  // send message to API /api/chat endpoint
  const sendMessage = async (message: string) => {
    setLoading(true);
    const newMessages = [
      ...messages,
      { role: "user", content: message } as ChatGPTMessage,
    ];
    setMessages(newMessages);

    let response = undefined;

    response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        user: cookie[COOKIE_NAME],
      }),
    });

    console.log("Edge function returned.");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream

    const data = response.body;

    if (!data) {
      return;
    }

    let reader = data.getReader();
    let decoder = new TextDecoder();
    let done = false;

    let lastMessage = "";
    let newJson = {};
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      lastMessage = lastMessage + chunkValue;
      setMessages([
        ...newMessages,
        { role: "assistant", content: lastMessage } as ChatGPTMessage,
      ]);

      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-zinc-100  lg:border lg:p-6">
      {messages.map(({ content, role }, index) => (
        <ChatLine key={index} role={role} content={content} />
      ))}

      {loading && <LoadingChatLine />}

      {messages.length < 2 && (
        <span className="mx-auto flex flex-grow text-gray-600 clear-both">
          Type a message to start the conversation
        </span>
      )}
      <InputMessage
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
      />
    </div>
  );
}
