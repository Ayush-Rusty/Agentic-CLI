import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins"; 

export const authClient = createAuthClient({
  plugins: [
    deviceAuthorizationClient(), 
  ],
});