import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  CheckIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";
import { useAuthState, useIdToken } from "react-firebase-hooks/auth";
import { auth } from "../../firebase_config";
import { on } from "events";
import { ParsedToken, User } from "@firebase/auth";
import * as CONSTANTS from "../../constants";

interface NotesSectionProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: UserStatus[];
  refreshUsers: () => void;
  selectedDocumentId: string;
}
interface UserStatus {
  name: string;
  id: string;
  online: boolean;
  locked: boolean;
}

export const OnlineModal: React.FC<NotesSectionProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  refreshUsers,
  selectedDocumentId,
}) => {
  const [user, loading] = useAuthState(auth);
  const [companyAdmin, setCompanyAdmin] = useState<boolean | undefined>(false);
  const cancelButtonRef = useRef(null);

  const toggleLock = async (lockState: boolean, uidToChange: string) => {
    let tok = await user?.getIdToken(true);

    console.log(selectedDocumentId);
    const result = await fetch(
      process.env.NEXT_PUBLIC_URL + "/api/get_api_key",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: tok!,
        },
        body: JSON.stringify({
          uid: selectedDocumentId,
        }),
      }
    );
    console.log(result);
    const { apiKey } = await result.json();
    await fetch(process.env.NEXT_PUBLIC_URL + "/api/toggleLocked", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        Authorization: tok!,
      },
      body: JSON.stringify({
        lock: !lockState,
        uidToChange: uidToChange,
      }),
    });
    refreshUsers();
  };

  useEffect(() => {
    if (!user && !loading) {
      window.location.href = "/login";
    }
    if (user) {
      user.getIdTokenResult(true).then((tokenResult) => {
        console.log(tokenResult.claims);
        setCompanyAdmin(tokenResult.claims.isAdmin as boolean);
      });
    }
  }, [user, loading]);

  if (!isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className=" dark:bg-[#1c1e20] relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6">
                <div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    Online Users
                  </Dialog.Title>

                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {onlineUsers.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center text-md font-bold text-gray-500 dark:text-gray-300 space-x-2"
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            user.online ? "bg-green-500" : "bg-red-500"
                          }`}
                          aria-hidden="true"
                        ></span>
                        {companyAdmin && (
                          <button
                            onClick={() => toggleLock(user.locked, user.id)}
                          >
                            {user.locked ? (
                              <LockClosedIcon
                                className="h-5 w-5 text-gray-500"
                                aria-hidden="true"
                              />
                            ) : (
                              <LockOpenIcon
                                className="h-5 w-5 text-gray-500"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        )}
                        <span>{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
