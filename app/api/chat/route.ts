import { Message } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const {
        messages,
        user_id,
        is_demo,
    }: {
        messages: Message[];
        user_id: string;
        is_demo?: boolean;
    } = await req.json();

    // Extract the last user message
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop();

    if (!lastUserMessage) {
        console.log("No user message found");
        return new Response("No user message found", { status: 400 });
    }

    try {
        // Make a request to the server
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_CHAT_API_URL}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    user_id: is_demo ? "demo-user" : user_id,
                    is_demo: is_demo || false,
                }),
            }
        );

        console.log("Server response status:", response.status);

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server response data:", data);

        // Return the response directly
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to process request" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
