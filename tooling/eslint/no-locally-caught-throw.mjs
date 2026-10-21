/** Finds explicit throws used to jump to a catch in the same synchronous function. */
const noLocallyCaughtThrow = {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      locallyCaught:
        "This throw is caught locally. Use ordinary control flow or move validation outside the try block.",
    },
  },
  create(context) {
    return {
      ThrowStatement(node) {
        let child = node;
        for (let parent = node.parent; parent; parent = parent.parent) {
          // A nested function executes in its own exception context, regardless of lexical nesting.
          if (
            [
              "FunctionDeclaration",
              "FunctionExpression",
              "ArrowFunctionExpression",
            ].includes(parent.type)
          )
            return;
          if (
            parent.type === "TryStatement" &&
            parent.handler &&
            child === parent.block
          ) {
            context.report({ node, messageId: "locallyCaught" });
            return;
          }
          child = parent;
        }
      },
    };
  },
};

export default noLocallyCaughtThrow;
