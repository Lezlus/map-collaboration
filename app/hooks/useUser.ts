"use client";

import { SessionUserType, USER_ID_LOCALSTORAGE_NAME, USERNAME_LOCALSTORAGE_NAME } from "@/types";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { uniqueNamesGenerator, names, Config } from "unique-names-generator";

const customConfig: Config = {
  dictionaries: [names],
};

interface SessionUserValidated extends SessionUserType {
  validated: boolean;
}


export function useUser(user: SessionUserType | null) {
  const [sessionUser, setSessionUser] = useState<SessionUserValidated | null>(null);
  useEffect(() => {
    function setUser() {
      if (user) {
        setSessionUser({...user, validated: true});
        return;
      }
      let id = localStorage.getItem(USERNAME_LOCALSTORAGE_NAME);
      let name = localStorage.getItem(USER_ID_LOCALSTORAGE_NAME);
      if (!id || !name) {
        id = uuidv4();
        name = uniqueNamesGenerator(customConfig);
        localStorage.setItem(USERNAME_LOCALSTORAGE_NAME, name);
        localStorage.setItem(USER_ID_LOCALSTORAGE_NAME, id);
      }
      // Users must be validated via email to be considered validated
      setSessionUser({
        id,
        name,
        validated: false
      });
    }
    setUser();
  }, [user]);
  return sessionUser
}