const BASE_URL = "https://slack.com/api";

export const genUpdateStatus = async (token: string): Promise<Response> => {
  return await fetch(`${BASE_URL}/users.profile.set`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile: {
        status_text: "Focused in Coding",
        status_emoji: ":computer:",
        status_expiration: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
      },
    }),
  });
};

export const genUpdateSnooze = async (token: string): Promise<Response> => {
  return await fetch(`${BASE_URL}/dnd.setSnooze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      num_minutes: 5,
    }),
    redirect: "follow",
  });
};

