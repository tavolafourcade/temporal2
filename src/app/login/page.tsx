"use client";

import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { log } from '@logtail/next';
import {
  doc,
  getDoc,
} from "firebase/firestore";
import {
  User,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context";

import { auth, db } from "../../../firebase_config";

const parseCompanyName = (companyName: string) => companyName.toLowerCase().replace(" ", "");

const handleSuccessfullLogin = async (user: User) => {
  const token = await user?.getIdToken();

  const userDocument = await getDoc(user && doc(db, "users", user?.uid!));
  const userSeatDocument = await getDoc(user && doc(db, "seats", user?.uid!));

  console.log({userDocument})
  const userNotFound = !userDocument.exists() && !userSeatDocument.exists();
  if (userNotFound) {
    await fetch("/api/init_account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token!,
      },
    });
  }

  // await fetch("/api/hydrate_user", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: token!,
  //   },
  // });

  const userSeatData = userSeatDocument.data();
  const tokenData = await user?.getIdTokenResult(true);
  const { hasSpecificFeatures } = tokenData.claims;

  return `/${hasSpecificFeatures ? parseCompanyName(`${userSeatData?.company}`) : "home"}`;
};

function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);

  const handleForgotPassword = () => {
    if (email === "") return window.alert("Please enter an email");

    const actionCodeSettings = {
      url: "https://roundoneinterview.com/signIn",
      handleCodeInApp: false,
    };

    sendPasswordResetEmail(auth, email, actionCodeSettings)
      .then(() => {
        alert("Password reset email sent!");
      })
      .catch((error) => {
        const credential = GoogleAuthProvider.credentialFromError(error);
        log.error(`sendPasswordResetEmail failed with message: ${error.message}`, { error, credential });
      });
  };

  const emailSignIn = () => {
    if (email === "" || password === "") return window.alert("Please fill out email and password fields.");

    return signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const nextRoute = await handleSuccessfullLogin(user);

        router.replace(nextRoute);
      })
      .catch((error) => {
        const credential = GoogleAuthProvider.credentialFromError(error);
        log.error(`signInWithEmailAndPassword failed with message: ${error.message}`, { error, credential });

        alert("Incorrect password");
      });
  };

  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();

    return signInWithPopup(auth, provider)
      .then(async (result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);

        const token = credential!.accessToken;
        const user = result.user;

        const nextRoute = await handleSuccessfullLogin(user);
        router.replace(nextRoute);
      })
      .catch((error) => {
        const credential = GoogleAuthProvider.credentialFromError(error);
        log.error(`signInWithPopup failed with message: ${error.message}`, { error, credential });
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
        <p className="text-2xl font-bold">Sign in to your account </p>
        <div className="">
          <button
            type="button"
            onClick={() => googleSignIn()}
            className="h-14 w-full text-white bg-[#1E43FF] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm py-2.5 dark:focus:ring-[#4285F4]/55  mb-2 mt-6 text-center"
          >
            <div className="flex justify-center">
              <svg
                className="w-6 h-6 justify-center"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              <p className="ml-2 text-lg">Continue with Google</p>
            </div>
          </button>
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-[100%] h-px my-8 bg-gray-200 border-0 dark:bg-gray-400" />
            <span className="absolute px-3 text-sm dark:text-gray-600 dark:bg-white">
              Or Sign In with your email
            </span>
          </div>

          <label className="flex flex-col">
            <span className="text-gray-500">Email address</span>
            <input
              type="text"
              onChange={handleMessageChange}
              className="
                    form-input
                    w-full
                    mr-4
                    h-10
                    px-3
                    mt-1
                    block
                    rounded-md
                    shadow-sm
                    border-neutral-200
                    focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50
                  "
              placeholder=""
            />
          </label>
          {forgotPassword && (
            <>
              <div
                onClick={() => setForgotPassword(false)}
                className="justify-start text-blue-600 hover:cursor-pointer"
              >
                Go back
              </div>
              <button
                type="button"
                className="w-full mt-10 border text-black bg-white hover:bg-gray-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center justify-center inline-flex"
                onClick={() => handleForgotPassword()}
              >
                Send password reset
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 ml-2 -mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </button>
            </>
          )}
          {!forgotPassword && (
            <>
              <label className="flex flex-col mt-2">
                <span className="text-gray-500">Password</span>
                <input
                  type="password"
                  onChange={(event) => setPassword(event.target.value)}
                  className="
                    form-input
                    w-full
                    mr-4
                    h-10
                    px-3
                    mt-1
                    block
                    rounded-md
                    shadow-sm
                    border-neutral-200
                    focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50
                  "
                  placeholder=""
                />
                <div
                  onClick={() => setForgotPassword(true)}
                  className="justify-start text-blue-600 hover:cursor-pointer"
                >
                  Forgot password?
                </div>
              </label>

              <div className="flex flex-col">
                <button
                  type="button"
                  className="mt-10 border text-black bg-white hover:bg-gray-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center justify-center inline-flex"
                  onClick={() => emailSignIn()}
                >
                  Continue with Email
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 ml-2 -mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </button>

                <div className="inline-flex space-x-2 mt-4 sm:text-base text-sm text-center justify-center">
                  <p className="text-center text-white text-gray-400">
                    Don&apos;nt have an account yet? Get started here
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
