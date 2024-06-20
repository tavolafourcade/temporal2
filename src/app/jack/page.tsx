"use client";
import React, {
  DetailedHTMLProps,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { InlineWidget, PopupButton, PopupWidget } from "react-calendly";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
type ChatGPTAgent = "user" | "system" | "assistant";
import Typewriter, { TypewriterClass } from "typewriter-effect";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

// const Calendly = dynamic(() => import("../components/Calendly"), {
//   ssr: false,
// });
const sizes: Record<string, string> = {
  "0": "w-[0%]",
  "10": "w-[10%]",
  "20": "w-[20%]",
  "40": "w-[40%]",
  "60": "w-[60%]",
  "80": "w-[80%]",
  "100": "w-[100%]",
};

const initialMessage: ChatGPTMessage[] = [
  {
    role: "user",
    content: "Hi!",
  },
];
const buttonVariants = {
  hidden: { opacity: 0, y: "5vh" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.5,
    },
  }),
};
export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [formText, setFormText] = useState("");
  const [messages, setMessages] = useState(initialMessage);
  const [showForm, setShowForm] = useState(true);
  const [nameEntered, setNameEntered] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);
  const [streamingDone, setStreamingDone] = useState(false);
  const [counter, setCounter] = useState(0);
  const [firstUseQ, setFirstUseQ] = useState(false);
  const [useQCounter, setUseQCounter] = useState(0);
  const [overallCounter, setOverallCounter] = useState(0);
  const [prevAnswer, setPrevAnswer] = useState("");
  const [percentComplete, setPercentComplete] = useState("0");

  const [rootElement, setRootElement] = useState<Document | null>(null);

  const initialRender = useRef(true);
  const router = useRouter();
  const handleRefresh = () => {
    router.replace("/");
  };

  useEffect(() => {
    initialRender.current = false;
    setRootElement(document);
  }, []);

  useEffect(() => {
    if (streamingDone) {
      setPercentComplete(String(Math.min(100, Number(percentComplete) + 20)));

      setShowForm(false); // First hide the form

      console.log(percentComplete);

      setAnimateKey((prevKey) => prevKey + 1);
      if (formText.includes("other side")) {
        console.log(formText);
      }

      //setShowForm(true);
      setStreamingDone(false);

      // setTimeout(() => {
      //   setAnimateKey((prevKey) => prevKey + 1);
      //   setShowForm(true);
      //   setStreamingDone(false);
      // }, 500); // adjust delay as needed
      // // reset streamingDone for the next form submission
    }
  }, [streamingDone]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };
  const typewriterinit = (typewriter: TypewriterClass) => {
    typewriter
      .changeDelay(15)
      .typeString(formText)
      .callFunction(() => {
        setShowForm(true);
      })
      .start();
  };

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
    title?: string
  ) => {
    event.preventDefault();

    const finalUserInput = title || userInput;

    console.log(`User input: ${userInput}`);

    setUserInput("");

    let newMessages = [...messages];
    if (overallCounter > 0) {
      newMessages.push({
        role: "user",
        content: finalUserInput,
      } as ChatGPTMessage);
      setMessages(newMessages);
    }

    const res = await fetch("/api/jack-chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = res.body;
    console.log(res);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    if (!data) {
      return;
    }

    let reader = data.getReader();
    let decoder = new TextDecoder();
    let done = false;
    setShowForm(false);
    setFirstUseQ(false);

    let lastMessage = "";
    setNameEntered(true);
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      lastMessage = lastMessage + chunkValue;
      //   setFormText(lastMessage);
    }
    setFormText(lastMessage);
    setCounter((prev) => prev + 1);
    setMessages([
      ...newMessages,
      { role: "assistant", content: lastMessage } as ChatGPTMessage,
    ]);
    setOverallCounter((prev) => prev + 1);
    setPrevAnswer(finalUserInput);

    setStreamingDone(true);
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };

  return (
    <main className=" flex flex-col min-h-screen items-center bg-white">
      <div id="__next" className="flex w-full justify-between">
        <div className="flex justify-start p-4">
          <button onClick={() => window.location.reload()}>
            <Image src={"/Razpng.jpeg"} width={140} height={100} alt="logo" />
          </button>
        </div>
        {/* <div className="flex items-center p-4 mr-4">
          {rootElement && (
            <button className="h-10 w-30 font-AeonikPro   text-black border border-black bg-white hover:bg-black hover:text-white focus:outline-none  dark:focus:ring-blue-800 rounded-lg text-sm px-5 py-2.5 text-center mb-2">
              <PopupButton
                url="https://calendly.com/robhaber/raz"
                rootElement={rootElement.getElementById("__next")!}
                text="Contact us"
              />
            </button>
          )}
        </div> */}
      </div>
      <div
        className={`mx-6 lg:mx-36 flex flex-col  justify-center flex-grow text-lg ${
          !nameEntered && "mx-0"
        }`}
      >
        <div className="w-[90%] sm:w-[96%] mx-4 mt-1 absolute top-0 left-0 outline-gray-300 outline-1 outline rounded-full h-2.5">
          <div
            className={`bg-[#FF5A5F] h-2.5 rounded-full ${sizes[percentComplete]}`}
          />
        </div>
        <motion.div
          className=" "
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {nameEntered && prevAnswer && (
            <div>
              {showForm && (
                <motion.div
                  key={animateKey}
                  className="absolute left-10 top-32"
                  initial={
                    initialRender.current
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.8 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {!formText.includes("aitlist") && (
                    <div>
                      <p className="font-bold text-2xl">Previous answer</p>
                      <p>{prevAnswer}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
          <div className="">
            {formText == "" && overallCounter == 0 ? (
              <div className="flex flex-col lg:-mt-5 -mt-12">
                <div className="font-bold tracking-tighter lg:tracking-tight text-center text-3xl lg:text-5xl text">
                  Jack&apos;s Prompt Masterclass
                </div>

                <div className="tracking-tight mt-2 mb-8 text-center text-2xl lg:text-4xl">
                  <Typewriter
                    onInit={(typewriter) => {
                      typewriter
                        .changeDelay(40)
                        .typeString(" Make your team 7-10x more powerful today")

                        .pauseFor(500)
                        .typeString(", with the power of AI")

                        .start();
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-20 font-bold text-3xl">
                {" "}
                <Typewriter onInit={typewriterinit} key={counter} />
              </div>
            )}

            {showForm && !formText.includes("other side") ? (
              <motion.div
                key={animateKey}
                className="flex flex-col "
                initial={
                  initialRender.current
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.8 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div
                  id="buttons"
                  className={
                    firstUseQ
                      ? "lg:space-x-4 flex-wrap mt-4 space-y-2"
                      : "hidden"
                  }
                >
                  <motion.button
                    type="submit"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                    className="w-30 h-12 text-white bg-[#FF5A5F] font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2}"
                    onClick={(event) =>
                      handleSubmit(event, "Lead qualification")
                    }
                  >
                    Lead qualification
                  </motion.button>
                  <motion.button
                    type="submit"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    className="w-30 h-12 text-white bg-[#FF5A5F] font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2}"
                    onClick={(event) => handleSubmit(event, "Hiring")}
                  >
                    Hiring
                  </motion.button>
                  <motion.button
                    type="submit"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                    className="w-30 h-12 text-white bg-[#FF5A5F] font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2}"
                    onClick={(event) => handleSubmit(event, "surveys")}
                  >
                    Surveys
                  </motion.button>
                  <motion.button
                    type="submit"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                    className="w-30 h-12 text-white bg-[#FF5A5F] font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2}"
                    onClick={(event) => handleSubmit(event, "feedback forms")}
                  >
                    Feedback
                  </motion.button>
                  <motion.button
                    type="submit"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                    className="w-30 h-12 text-white bg-[#FF5A5F] font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2}"
                    onClick={(event) => handleSubmit(event, "other")}
                  >
                    Other
                  </motion.button>
                </div>
                {
                  <form onSubmit={handleSubmit}>
                    {overallCounter > 0 && (
                      <textarea
                        className="focus:outline-none mt-4 text-left placeholder-left bg-transparent w-full"
                        style={{
                          resize: "none",
                          overflow: "auto",
                          caretColor: showForm ? "auto" : "transparent",
                        }}
                        value={userInput}
                        placeholder={`${
                          showForm ? "Type your response here..." : ""
                        }`}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                      />
                    )}

                    <div
                      className={`flex items-center ${
                        overallCounter == 0 && "justify-center"
                      }`}
                    >
                      <button
                        type="submit"
                        className={`text-white bg-[#FF5A5F] ${
                          overallCounter == 0 && "rounded-3xl "
                        }
                        } font-medium  rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2`}
                      >
                        {overallCounter == 0 ? "Sign Up" : "Next"}
                      </button>
                      {overallCounter > 0 ? (
                        <>
                          <div className="border -mt-2 bg-gray-200 rounded-md ml-4">
                            <div className="flex justify-center p-1">
                              <svg
                                width="12"
                                height="9"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="m.196 6.08 2.393 2.393c.414.413 1.134.12 1.134-.473V6.273h4.666a3.335 3.335 0 0 0 3.334-3.333v-2c0-.367-.3-.667-.667-.667-.367 0-.667.3-.667.667v2c0 1.1-.9 2-2 2H3.723V3.213a.669.669 0 0 0-1.14-.473L.189 5.133a.678.678 0 0 0 .007.947Z"
                                  fill="#1C1D48"
                                ></path>
                              </svg>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs -mt-2 ml-2 text-gray-500">
                              Or Press Enter
                            </p>
                          </div>
                        </>
                      ) : (
                        <></>
                      )}
                    </div>
                  </form>
                }
              </motion.div>
            ) : formText.includes("training and prompts") ? (
              <div className="mt-4">
                <a
                  target="_blank"
                  href="https://aipoweredrecruiter.com"
                  rel="noopener noreferrer"
                >
                  <button
                    className={`text-white bg-[#FF5A5F] ${
                      overallCounter == 0 && "rounded-3xl "
                    }
                        } font-medium  rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2`}
                  >
                    Check our our site
                  </button>
                </a>
              </div>
            ) : (
              <div className="flex items-center h-[125px]"></div>
            )}
          </div>
        </motion.div>
      </div>

      <footer className="self-start ml-4">
        <div className=" max-w-7xl px-6 py-12 self-start lg:px-8">
          <div className="flex justify-start space-x-6 md:order-2">
            <a className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Privacy</span>
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; 2023 Raz (Round One, Inc.)
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
