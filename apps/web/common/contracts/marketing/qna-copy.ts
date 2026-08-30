export type QnaIntroCopy = {
  primary: string;
  secondary: string;
};

export type QnaItemCopy = {
  question: string;
  answer: string;
  link?: {
    href: string;
    label: string;
  };
};

export type QnaSecondaryContactCopy = {
  hint: string;
  label: string;
  href: string;
};
