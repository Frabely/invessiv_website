import noLocallyCaughtThrow from "./no-locally-caught-throw.mjs";
import preferPackageBarrelImport from "./prefer-package-barrel-import.mjs";

const localRules = {
  plugins: {
    invessiv: {
      rules: {
        "no-locally-caught-throw": noLocallyCaughtThrow,
        "prefer-package-barrel-import": preferPackageBarrelImport,
      },
    },
  },
  rules: {
    "invessiv/no-locally-caught-throw": "error",
    "invessiv/prefer-package-barrel-import": "error",
  },
};

export default localRules;
