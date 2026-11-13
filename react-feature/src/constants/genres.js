// Post types and genres a post can be tagged with. Shared by Create Post
// (tagging) and the feed (filtering), so both always offer the same options.

export const POST_TYPES = ["Song", "Beat", "Loop", "Sample", "Acapella", "Instrument", "Open", "Free", "Paid"];

export const MUSIC_GENRES = [
  "Hip Hop", "Underground", "Trap", "Drill", "Pop", "Punk", "Rock", "Jazz", "R&B", "Electronic",
  "Classical", "Reggae", "Metal", "Country", "Indie", "Folk", "Blues", "Afrobeat",
];

export const GENRES = [...POST_TYPES, ...MUSIC_GENRES];
