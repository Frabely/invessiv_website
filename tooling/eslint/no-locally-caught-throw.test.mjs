import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import rule from "./no-locally-caught-throw.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
new RuleTester().run("no-locally-caught-throw", rule, {
  valid: [
    "if (invalid) throw new Error();",
    "try { parse(); } catch { throw new Error('invalid'); }",
    "try { throw new Error(); } finally { cleanup(); }",
    "try { const fn = () => { throw new Error(); }; } catch {}",
    "try { function validate() { throw new Error(); } } catch {}",
    "try { const fn = function () { throw new Error(); }; } catch {}",
    "try { work(); } catch (error) { throw error; }",
  ],
  invalid: [
    {
      code: "try { if (invalid) throw new Error(); } catch {}",
      errors: [{ messageId: "locallyCaught" }],
    },
    {
      code: "try { throw new Error(); } catch (error) { handle(error); }",
      errors: [{ messageId: "locallyCaught" }],
    },
    {
      code: "try { try { throw new Error(); } finally {} } catch {}",
      errors: [{ messageId: "locallyCaught" }],
    },
    {
      code: "try { try { work(); } catch { throw new Error(); } } catch {}",
      errors: [{ messageId: "locallyCaught" }],
    },
    {
      code: "try { try { work(); } finally { throw new Error(); } } catch {}",
      errors: [{ messageId: "locallyCaught" }],
    },
  ],
});
