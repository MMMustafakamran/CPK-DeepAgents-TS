# Tool Rendering

> Render your agent's tool calls with custom UI components.
{/* TODO: swap feature-viewer URLs back to /deepagents/ once the dojo supports that route */}
<IframeSwitcher
  id="backend-tools-example"
  exampleUrl="https://feature-viewer.copilotkit.ai/langgraph/feature/backend_tool_rendering?sidebar=false&chatDefaultOpen=false"
  codeUrl="https://feature-viewer.copilotkit.ai/langgraph/feature/backend_tool_rendering?view=code&sidebar=false&codeLayout=tabs"
  exampleLabel="Demo"
  codeLabel="Code"
  height="700px"
/>

<Callout>
  This example demonstrates the [implementation](#implementation) section applied in the <a href="https://feature-viewer.copilotkit.ai/langgraph/feature/agentic_chat" target="_blank">CopilotKit feature viewer</a>.
</Callout>

## What is this?

Tools are a way for the LLM to call predefined, typically, deterministic functions. CopilotKit allows you to render these tools in the UI
as a custom component, which we call **Generative UI**.

## When should I use this?

Rendering tools in the UI is useful when you want to provide the user with feedback about what your agent is doing, specifically
when your agent is calling tools. CopilotKit allows you to fully customize how these tools are rendered in the chat.

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
### Give your agent a tool to call

<Tabs groupId="agent_language" items={['Python', 'TypeScript']} persist>
    <Tab value="Python">
        ```python title="agent.py"
        from deepagents import create_deep_agent
        from langchain.tools import tool

        # [!code highlight:6]
        @tool
        def get_weather(location: str):
            """
            Get the weather for a given location.
            """
            return f"The weather for {location} is 70 degrees."

        agent = create_deep_agent(
            model="openai:gpt-4o",
            tools=[get_weather], # [!code highlight]
            system_prompt="You are a helpful assistant.",
        )
        ```
    </Tab>
    <Tab value="TypeScript">
        ```ts title="agent.ts"
        import { createDeepAgent } from "deepagents";
        import { tool } from "langchain";
        import { z } from "zod";

        // [!code highlight:12]
        const getWeather = tool(
          (args) => {
            return `The weather for ${args.location} is 70 degrees.`;
          },
          {
            name: "get_weather",
            description: "Get the weather for a given location.",
            schema: z.object({
              location: z.string().describe("The location to get weather for"),
            }),
          }
        );

        export const agent = createDeepAgent({
          model: "openai:gpt-4o",
          tools: [getWeather], // [!code highlight]
          systemPrompt: "You are a helpful assistant.",
        });
        ```
    </Tab>
</Tabs>
</Step>
<Step>
### Render the tool call in your frontend
At this point, your agent will be able to call the `get_weather` tool. Now
we just need to add a `useRenderTool` hook to render the tool call in
the UI.

<Callout type="info" title="Important">
  In order to render a tool call in the UI, the name must match the name of the tool.
</Callout>

```tsx title="app/page.tsx"
import { useRenderTool } from "@copilotkit/react-core/v2"; // [!code highlight]
import { z } from "zod";
// ...

const weatherParams = z.object({
  location: z.string().describe("The location to get weather for"),
});

const YourMainContent = () => {
  // ...
  // [!code highlight:14]
  useRenderTool({
    name: "get_weather",
    parameters: weatherParams,
    render: ({ status, parameters }) => {
      return (
        <p className="text-gray-500 mt-2">
          {status !== "complete" && "Calling weather API..."}
          {status === "complete" && `Called the weather API for ${parameters.location}.`}
        </p>
      );
    },
  });
  // ...
}
```

</Step>
<Step>
### Give it a try!

Try asking the agent to get the weather for a location. You should see the custom UI component that we added
render the tool call and display the arguments that were passed to the tool.

</Step>
</Steps>

## Default Tool Rendering

`useDefaultRenderTool` provides a catch-all renderer for **any tool** that doesn't have a specific `useRenderToolCall` defined. This is useful for:

- Displaying all tool calls during development
- Rendering MCP (Model Context Protocol) tools
- Providing a generic fallback UI for unexpected tools

```tsx title="app/page.tsx"
import { useDefaultRenderTool } from "@copilotkit/react-core/v2"; // [!code highlight]
// ...

const YourMainContent = () => {
  // ...
  // [!code highlight:15]
  useDefaultRenderTool({
    render: ({ name, args, status, result }) => {
      return (
        <div style={{ color: "black" }}>
          <span>
            {status === "complete" ? "✓" : "⏳"}
            {name}
          </span>
          {status === "complete" && result && (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      );
    },
  });
  // ...
};
```

<Callout type="info">
  Unlike `useRenderToolCall`, which targets a specific tool by name,
  `useDefaultRenderTool` catches **all** tools that don't have a dedicated
  renderer.
</Callout>

<Callout type="info">
  In v2, use [`useDefaultRenderTool`](/reference/v2/hooks/useDefaultRenderTool)
  for wildcard fallback rendering, and
  [`useRenderTool`](/reference/v2/hooks/useRenderTool) for named or wildcard
  renderer registration.
</Callout>
