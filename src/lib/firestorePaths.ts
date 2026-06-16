export const userProfilePath = (uid: string) => `users/${uid}`;

export const userSourcePath = (uid: string, sourceId: string) =>
  `users/${uid}/sources/${sourceId}`;

export const userItemPath = (uid: string, itemId: string) =>
  `users/${uid}/items/${itemId}`;

