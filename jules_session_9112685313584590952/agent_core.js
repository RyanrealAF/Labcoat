export const decodeTopic = async (topicTitle, content, env) => {
    const SYSTEM_PROMPT = `
    Kernel: The Unseen Game v1.0.
    Context: Analyzing the topic "${topicTitle}".
    Task: Identify the specific Psychological Warfare Phase (1-4) this topic maps to.
    Format: Strict JSON only.
  `;
    const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Decode this content for weaponization patterns: ${content}` }
        ]
    });
    // Simplified extraction logic for high-performance edge execution
    try {
        return JSON.parse(response.response || response);
    }
    catch (e) {
        return {
            tactical_overlay: {
                phase: 1,
                breadcrumb_id: "ERR_SIG",
                orchestrator_intent: "Data Obfuscation",
                counter_move: "Radical Self-Trust"
            },
            inner_game_signal: "Signal noise detected. Trust intuition over data."
        };
    }
};
