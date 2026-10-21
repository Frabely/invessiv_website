import noLocallyCaughtThrow from "./no-locally-caught-throw.mjs";

const localRules = {
  plugins: {
    invessiv: { rules: { "no-locally-caught-throw": noLocallyCaughtThrow } },
  },
  rules: { "invessiv/no-locally-caught-throw": "error" },
};

export default localRules;
