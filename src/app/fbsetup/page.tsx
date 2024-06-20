"use client";
import { FacebookAuthProvider, getAuth, signInWithPopup } from "@firebase/auth";
import { auth, db } from "../../../firebase_config";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { redirect, useRouter } from "next/navigation";
import { useDocumentDataOnce } from "react-firebase-hooks/firestore";
import {
  doc,
  DocumentData,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function Login() {
  const provider = new FacebookAuthProvider();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  provider.addScope("instagram_manage_messages");
  provider.addScope("business_management");
  provider.addScope("instagram_basic");
  provider.addScope("instagram_manage_comments");

  provider.addScope("pages_messaging");
  provider.addScope("pages_manage_metadata");
  provider.addScope("pages_show_list");

  const updateFunc = async (accesstoken: any) => {
    const token = await user?.getIdToken(true);
    await fetch("/api/instagram_connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token!,
      },
      body: JSON.stringify({ accesstoken }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  };
  const handleSignIn = async () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        // The signed-in user info.
        const user = result.user;

        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        const credential = FacebookAuthProvider.credentialFromResult(result);
        const accessToken = credential!.accessToken;
        console.log(credential);
        console.log(result);

        updateFunc(accessToken);
        router.push("/messager");

        // IdP data available using getAdditionalUserInfo(result)
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = FacebookAuthProvider.credentialFromError(error);

        console.log(credential);
        console.log(errorMessage);
        updateFunc(credential?.accessToken);
        router.push("/fbmessager");

        // ...
      });
  };

  return (
    <div className="bg-[#ffffff] h-screen w-screen grid content-center justify-evenly">
      <div className="flex flex-col px-12 sm:px-24 ">
        <Image
          src="/Razpng.jpeg"
          width={200}
          height={200}
          alt="logo"
          className="ml-10 mb-10"
        />
        <p className="text-2xl font-bold">
          Please connect your Facebook account to continue{" "}
        </p>

        {/* <div className="flex justify-center text-white font-sans font-semibold rounded w-72 h-10 mt-4 border">
        <button onClick={() => signIn("google")} className=" bg-[blue] ">
          <Image
            src="/GoogleG.png"
            width={20}
            height={10}
            className="flex-none"
            alt="G logo"
          ></Image>
          <p>Continue with Google</p>
        </button> */}
        {/* </div> */}
        <div className="mt-4">
          <button
            onClick={() => handleSignIn()}
            type="button"
            className="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 me-2 mb-2"
          >
            <svg
              className="w-4 h-4 me-2"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 8 19"
            >
              <path
                fill-rule="evenodd"
                d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z"
                clip-rule="evenodd"
              />
            </svg>
            Sign in with Facebook
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
