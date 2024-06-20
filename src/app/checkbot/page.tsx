"use client";
import { Layout, Text, Page } from "@vercel/examples-ui";
import { Chat } from "../../components/Chat";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase_config";

function Home() {
  const [user, loading] = useAuthState(auth);
  const [person, setPerson] = useState("");
  const [personkey, setPersonKey] = useState("test23");
  const [leadName, setLeadName] = useState("Rob");
  const [budget, setBudget] = useState(500);
  const [meetingBooked, setMeetingBooked] = useState(false);
  const [token, setToken] = useState("");

  // dont allow user to chat if not logged in
  useEffect(() => {
    if (!user && !loading) {
      window.location.href = "/login";
    }
    if (user) {
   
      user.getIdToken().then((token) => {
        setToken(token);
      });
    }
  }, [user, loading]);

  useEffect(() => {
    if (person == "yash") {
      setPersonKey("test23");
    } else if (person == "tanner") {
      setPersonKey("test21");
    } else if (person == "limelight") {
      setPersonKey("lime84");
    } else if (person == "agencybox") {
      setPersonKey("abox19");
    }
  }, [person]);

  return (
    <>
      {loading || !user ? (
        <div>loading</div>
      ) : (
        <Page className="flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            {/* <Text variant="h1">OpenAI GPT-3 text model usage example</Text>
        <Text className="text-zinc-600">
          In this example, a simple chat bot is implemented using Next.js, API
          Routes, and OpenAI API.
        </Text> */}
          </section>

          <section className="flex flex-col gap-3 p-4">
            {/* Dropdown box that lets you choose between Yash and Tanner */}
            <div className="flex flex-row gap-3">
              <div className="flex flex-col gap-1">
                <Text>Choose the bot to chat with:</Text>
                <select
                  className="bg-white border border-gray-300 rounded-md shadow-sm p-2"
                  onChange={(e) => {
                    setPerson(e.target.value);
                  }}
                >
                  <option value="yash">Yash</option>
                  <option value="tanner">Tanner</option>
                  <option value="limelight">Limelight</option>
                  <option value="agencybox">Agency Box</option>
                </select>
              </div>
            </div>
            {/* Input box that lets you input lead name with default Rob */}
            <div className="flex flex-col w-48">
              <Text>Enter the lead name:</Text>
              <input
                className="bg-white border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Rob"
                onChange={(e) => {
                  setLeadName(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col w-48">
              <Text>Enter the budget:</Text>
              <input
                className="bg-white border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="500"
                onChange={(e) => {
                  setBudget(Number(e.target.value));
                }}
              />
            </div>
            {/* Yes/no dropdown for meeting already booked */}
            <div className="flex flex-col w-48">
              <Text>Meeting already booked?</Text>
              <select
                className="bg-white border border-gray-300 rounded-md shadow-sm p-2"
                onChange={(e) => {
                  setMeetingBooked(e.target.value == "true" ? true : false);
                }}
              >
                <option value="false">False</option>
                <option value="true">True</option>
              </select>
            </div>

            <div className="lg:w-2/3">
              <Chat
                token={token}
                person={personkey}
                leadName={leadName}
                budget={budget}
                meetingBooked={meetingBooked}
              />
            </div>
          </section>
        </Page>
      )}
    </>
  );
}

Home.Layout = Layout;

export default Home;
