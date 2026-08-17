# Frontend Tools

> Create frontend tools and use them within your Deep Agents agent.
{/* TODO: swap feature-viewer URLs back to /deepagents/ once the dojo supports that route */}
<IframeSwitcher
  id="frontend-actions-example"
  exampleUrl="https://feature-viewer.copilotkit.ai/langgraph/feature/agentic_chat?sidebar=false&chatDefaultOpen=false"
  codeUrl="https://feature-viewer.copilotkit.ai/langgraph/feature/agentic_chat?view=code&sidebar=false&codeLayout=tabs"
  exampleLabel="Demo"
  codeLabel="Code"
  height="700px"
/>

## What is this?
Frontend tools enable you to define client-side functions that your Deep Agents agent can invoke, with execution happening entirely in the user's browser. When your agent calls a frontend tool,
the logic runs on the client side, giving you direct access to the frontend environment.

This can be utilized to let your agent control the UI, for generative UI, or for Human-in-the-loop interactions.

In this guide, we cover the use of frontend tools driving and interacting with the UI.

## When should I use this?
Use frontend tools when you need your agent to interact with client-side primitives such as:
- Reading or modifying React component state
- Accessing browser APIs like localStorage, sessionStorage, or cookies
- Triggering UI updates or animations
- Interacting with third-party frontend libraries
- Performing actions that require the user's immediate browser context

## Implementation

<Steps>
    <Step>
        ### Run and connect your agent
       You'll need to run your agent and connect it to CopilotKit before proceeding. If you haven't done so already,
you can follow the instructions in the [Getting Started](/langgraph/quickstart) guide.

If you don't already have an agent, you can use the [coagent starter](https://github.com/copilotkit/copilotkit/tree/main/examples/coagents-starter) as a starting point
as this guide uses it as a starting point.

    </Step>

    <Step>
        ### Create a frontend tool

        First, you'll need to create a frontend tool using the [useFrontendTool](/reference/v2/hooks/useFrontendTool) hook. Here's a simple one to get you started
        that says hello to the user.

        ```tsx title="page.tsx"
        import { z } from "zod";
        import { useFrontendTool } from "@copilotkit/react-core/v2" // [!code highlight]

        export function Page() {
          // ...

          // [!code highlight:12]
          useFrontendTool({
            name: "sayHello",
            description: "Say hello to the user",
            parameters: z.object({
              name: z.string().describe("The name of the user to say hello to"),
            }),
            handler: async ({ name }) => {
              alert(`Hello, ${name}!`);
              return `Said hello to ${name}!`;
            },
          });

          // ...
        }
        ```
    </Step>
    <Step>
        ### Install the CopilotKit SDK

        Now, we'll need to modify the agent to access these frontend tools. In your terminal, navigate to your agent's folder and continue from there!

        Any LangGraph agent can be used with CopilotKit. However, creating deep agentic
experiences with CopilotKit requires our LangGraph SDK.

<Tabs
  groupId="language_langgraph_agent"
  items={["Python", "TypeScript"]}
  persist
>
  <Tab value="Python">
    
<Tabs className="p-0 m-0" groupId="python-pm" items={['uv', 'poetry', 'pip', 'conda']} default="uv">
    <Tab value="uv">
    ```bash
    uv add copilotkit
    ```
    </Tab>
    <Tab value="poetry">
    ```bash
    poetry add copilotkit
    ```
    </Tab>

    <Tab value="pip">

    ```bash
    pip install copilotkit --extra-index-url https://copilotkit.gateway.scarf.sh/simple/
    ```
    </Tab>

    <Tab value="conda">
    ```bash
    conda install copilotkit -c copilotkit-channel
    ```
    </Tab>

</Tabs>

  </Tab>
  <Tab value="TypeScript">
    ```npm npm install @copilotkit/sdk-js ```
  </Tab>
</Tabs>

    </Step>
    <Step>
        ### Wire CopilotKit state into your agent

        To access the frontend tools provided by CopilotKit, register the CopilotKit state alongside any custom state your agent needs.

        <Tabs groupId="agent_language" items={['Python', 'TypeScript']} persist>
            <Tab value="Python">
                In Python, inherit from `CopilotKitState` in your agent's state definition:

                ```python title="agent.py"
                from copilotkit import CopilotKitState # [!code highlight]

                class YourAgentState(CopilotKitState): # [!code highlight]
                    your_additional_properties: str
                ```
            </Tab>
            <Tab value="TypeScript">
                In TypeScript, define your custom state as a middleware via `createMiddleware` and compose it with `copilotkitMiddleware`:

                ```ts title="agent.ts"
                import { createMiddleware } from "langchain";
                import { copilotkitMiddleware } from "@copilotkit/sdk-js/langgraph"; // [!code highlight]
                import { z } from "zod";

                export const yourStateMiddleware = createMiddleware({
                    name: "YourAgentState",
                    stateSchema: z.object({
                        yourAdditionalProperty: z.string().optional(),
                    }),
                });

                // Pass both middlewares when constructing the agent:
                // createDeepAgent({ middleware: [yourStateMiddleware, copilotkitMiddleware], ... })
                ```
            </Tab>
        </Tabs>

        By doing this, your agent's state will include the `copilotkit` property, which contains the frontend tools that can be accessed and invoked.
    </Step>
    <Step>
        ### Accessing Frontend Tools

        Once your agent's state includes the `copilotkit` property, you can access the frontend tools and utilize them within your agent's logic.

        Here's how you can call a frontend tool from your agent:

        
<IframeSwitcher
  id="frontend-actions-example"
  exampleUrl={`https://feature-viewer.copilotkit.ai/${props.framework || "langgraph"}/feature/agentic_chat?sidebar=false&chatDefaultOpen=false`}
  codeUrl={`https://feature-viewer.copilotkit.ai/${props.framework || "langgraph"}/feature/agentic_chat?view=code&sidebar=false&codeLayout=tabs`}
  exampleLabel="Demo"
  codeLabel="Code"
  height="700px"
/>

## What is this?

Frontend tools enable you to define client-side functions that your agent can invoke, with execution happening entirely in the user's browser. When your agent calls a frontend tool, the logic runs on the client side, giving you direct access to the frontend environment.

This can be utilized to let your agent control the UI, for generative UI, or for Human-in-the-loop interactions. In this guide, we cover the use of frontend tools driving and interacting with the UI.

## When should I use this?

Use frontend tools when you need your agent to interact with client-side primitives such as:

- Reading or modifying React component state
- Accessing browser APIs like localStorage, sessionStorage, or cookies
- Triggering UI updates or animations
- Interacting with third-party frontend libraries
- Performing actions that require the user's immediate browser context

## Create a frontend tool

Use the `useFrontendTool` hook to create a tool that your agent can call from the client side:

```tsx title="page.tsx"
import { z } from "zod";
import { useFrontendTool } from "@copilotkit/react-core/v2"; // [!code highlight]

export function Page() {
  // ...

  // [!code highlight:12]
  useFrontendTool({
    name: "sayHello",
    description: "Say hello to the user",
    parameters: z.object({
      name: z.string().describe("The name of the user to say hello to"),
    }),
    handler: async ({ name }) => {
      alert(`Hello, ${name}!`);
      return `Said hello to ${name}!`;
    },
  });

  // ...
}
```


        These tools are automatically populated by CopilotKit and are compatible with LangChain's tool call definitions, making it straightforward to integrate them into your agent's workflow.
    </Step>
    <Step>
        ### Give it a try!
        You've now given your agent the ability to directly call any frontend tools you've defined. These tools will be available to the agent where they can be used as needed.

        <video src="https://cdn.copilotkit.ai/docs/copilotkit/images/frontend-actions-demo.mp4" className="rounded-lg shadow-xl" loop playsInline controls autoPlay muted />
    </Step>
</Steps>
