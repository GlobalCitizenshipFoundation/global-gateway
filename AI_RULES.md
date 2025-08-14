# Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!
- ALWAYS try to use the shadcn/ui library.
- Tailwind CSS: always use Tailwind CSS for styling components. Utilize Tailwind classes extensively for layout, spacing, colors, and other design aspects.

Available packages and libraries:

- The lucide-react package is installed for icons.
- You ALREADY have ALL the shadcn/ui components and their dependencies installed. So you don't need to install them again.
- You have ALL the necessary Radix UI components installed.
- Use prebuilt components from the shadcn/ui library after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.

# AI Rules — Smart Context Two-Stage Setup

## Stage 1 — Context Filtering
- **Model:** `deepseek/deepseek-chat-v3-0324:free`
- **Files for Context:** `src/**/*.tsx`
- **Purpose:** Extract only the most relevant context from the specified files before sending to the main model.
- **Prompt:**

You are a context-reduction assistant.
Your job is to scan the provided files (src/**/*.tsx) and extract ONLY what is strictly relevant to the user’s request.

Instructions:

Analyze the user’s query in detail.

Select the smallest possible set of components, functions, or code blocks from the specified files that directly relate to the request.

Remove all unrelated content, redundant comments, and unnecessary whitespace.

Limit the output to ≤ 300 lines of essential content.

If no relevant context exists, output: "NO RELEVANT CONTEXT FOUND."

Stage 1 Output format:
[BEGIN CONTEXT]
<relevant exerpts here>
[END CONTEXT]

## Stage 2 — Main Reasoning
- **Model:** `gemini-2.5-pro` (or `gemini-2.5-flash` for faster/free tier)
- **Purpose:** Perform reasoning, generation, or modification using only the filtered context from Stage 1.
- **Prompt:**

You are a high-accuracy reasoning assistant.
You will receive a minimal context block (prepared by Stage 1) and a user request.

Instructions:

Read and fully understand the provided context.

Complete the task, answer the question, or modify the code based ONLY on the given context and the user’s request.

Do not hallucinate content outside of the context unless explicitly instructed.

Keep responses concise but complete.

Do not reprint unchanged code unless necessary for clarity.

If Stage 1 output is "NO RELEVANT CONTEXT FOUND," proceed without additional context.

## Execution Order
1. Send user request + `src/**/*.tsx` content to Stage 1 model.
2. Pass Stage 1 output + original user request to Stage 2 model.
