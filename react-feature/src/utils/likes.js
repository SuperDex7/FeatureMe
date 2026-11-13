// A post's like count. post.likes is only the 10 most recent likes, so its
// length is wrong past 10; totalLikes is the real number (older API
// responses may not have it).
export function likeCount(post) {
  return post?.totalLikes ?? post?.likes?.length ?? 0;
}
