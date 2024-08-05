import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req) {
  const body = await req.json();
  const completion = await openai.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `Suggest a recipe using ${body.inventory
          .map((obj) => `${obj.quantity} ${obj.item}`)
          .join(
            ", "
          )}. Return the recipe as a JSON object with the properties name,
          instructions and ingredients. Each property should be of type string.`,
      },
    ],
  });

  return Response.json({ recipes: completion.choices[0].message });
}
