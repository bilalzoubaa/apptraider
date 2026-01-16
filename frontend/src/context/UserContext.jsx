import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [challengeId, setChallengeId] = useState(null);

  useEffect(() => {
    const syncState = async () => {
      const u = localStorage.getItem("user");
      if (u) {
        const parsedUser = JSON.parse(u);
        setUser(parsedUser);

        try {
          // Verify active challenge with backend
          const res = await axios.get(`/api/challenges/active?user_id=${parsedUser.id}`);
          const activeId = res.data.active_challenge_id;

          if (activeId) {
            console.log("Found active challenge:", activeId);
            setChallengeId(activeId);
            localStorage.setItem("userChallengeId", String(activeId));
          } else {
            console.log("No active challenge found.");
            setChallengeId(null);
            localStorage.removeItem("userChallengeId");
          }
        } catch (err) {
          console.error("Error syncing challenge state:", err);
          // Fallback to local storage if API fails (offline?), or clear if critical
        }
      }
    };

    syncState();
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userChallengeId");
    setUser(null);
    setChallengeId(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, challengeId, setChallengeId, logout }}>
      {children}
    </UserContext.Provider>
  );
}
