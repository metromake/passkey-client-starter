import fetchData from "@/lib/fetchData";
import { User } from "@sharedTypes/DBTypes";
import { LoginResponse, UserResponse } from "@sharedTypes/MessageTypes";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server/script/deps";

const useUser = () => {
  const getUserByToken = async (token: string) => {
    const options = {
      headers: {
        Authorization: "Bearer " + token,
      },
    };
    return await fetchData<UserResponse>(
      import.meta.env.VITE_AUTH_API + "/users/token/",
      options
    );
  };

  const getUsernameAvailable = async (username: string) => {
    return await fetchData<{ available: boolean }>(
      import.meta.env.VITE_AUTH_API + "/users/username/" + username
    );
  };

  const getEmailAvailable = async (email: string) => {
    return await fetchData<{ available: boolean }>(
      import.meta.env.VITE_AUTH_API + "/users/email/" + email
    );
  };

  return { getUserByToken, getUsernameAvailable, getEmailAvailable };
};

const usePasskey = () => {
  const postUser = async (
    user: Pick<User, "username" | "email" | "password">
  ) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    };

    const registrationResponse = await fetchData<{
      email: string;
      options: PublicKeyCredentialCreationOptionsJSON;
    }>(import.meta.env.VITE_PASSKEY_API + "/auth/setup", options);

    const attResp = await startRegistration(registrationResponse.options);

    const data = {
      email: registrationResponse.email,
      registrationOptions: attResp,
    };

    return await fetchData<UserResponse>(
      import.meta.env.VITE_PASSKEY_API + "/auth/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
  };

  const postLogin = async (email: string) => {
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    };
    const authenticaitonResponse =
      await fetchData<PublicKeyCredentialCreationOptionsJSON>(
        import.meta.env.VITE_PASSKEY_API + "/auth/login-setup",
        options
      );

    const authResponse = await startAuthentication(authenticaitonResponse);

    const loginOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, authResponse }),
    };
    const verificationResponse = await fetchData<LoginResponse>(
      import.meta.env.VITE_PASSKEY_API + "/auth/login-verify",
      loginOptions
    );
    return verificationResponse;
  };

  return { postUser, postLogin };
};

export { useUser, usePasskey };
