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
        status_emoji: __getRandomEmoji(),
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

const __getRandomEmoji = () => {
  const focusEmojis = [
    ":fire:",
    ":muscle:",
    ":dart:",
    ":rocket:",
    ":hourglass_flowing_sand:",
    ":brain:",
    ":books:",
    ":bulb:",
    ":man-technologist:",
    ":woman-technologist:",
    ":seedling:",
    ":chart_with_upwards_trend:",
    ":alarm_clock:",
    ":stopwatch:",
    ":mage:",
    ":sparkles:",
    ":weight_lifter:",
    ":battery:",
    ":hammer_and_wrench:",
  ];
  const randomEmoji =
    focusEmojis[
      Math.min(
        Math.floor(Math.random() * focusEmojis.length),
        focusEmojis.length - 1
      )
    ];
  return randomEmoji;
};
