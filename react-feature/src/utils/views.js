import { addView } from "../services/PostsService";

const VIEW_COOLDOWN_MS = 15 * 1000;

// Records a play as a view, at most once per 15 seconds per user and post.
export async function recordView(postId, currentUser) {
  if (!currentUser) return;
  const cooldownKey = `view_${postId}_${currentUser.userName}`;
  const lastViewTime = Number(localStorage.getItem(cooldownKey) || 0);
  const now = Date.now();
  if (now - lastViewTime < VIEW_COOLDOWN_MS) return;
  try {
    await addView(postId);
    localStorage.setItem(cooldownKey, String(now));
  } catch (error) {
    console.error("Error adding view:", error);
  }
}
