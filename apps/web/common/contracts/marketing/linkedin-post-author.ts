export type LinkedinPostAvatar =
  | { kind: "initials"; value: string }
  | { kind: "image"; src: string; alt: string };

export type LinkedinPostAuthor = {
  name?: string;
  role: string;
  avatar: LinkedinPostAvatar;
};
