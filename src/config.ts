export const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export const CHECK_INTERVAL = 6 * 1000; // 6 seconds in milliseconds

export const SLACK_CLIENT_ID = "8117332080880.8400580476353";

// TODO(Taman / critical): Change to VSCode Redirect URI
export const SLACK_REDIRECT_URI = "https://slacktron.com/slack/callback";

export const SLACK_URL = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=users.profile:write,dnd:write&redirect_uri=${SLACK_REDIRECT_URI}`;
