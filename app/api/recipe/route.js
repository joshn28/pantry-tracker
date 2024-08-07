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
        content: `Suggest recipes using ${body.inventory
          .map((obj) => `${obj.item}`)
          .join(
            ", "
          )}. Return an JSON object of 3 recipes as properties where each recipe
          is a JSON object with the properties name, instructions and ingredients.
          The ingredients should include the exact measurements of the items needed
          for the recipe as a string. Each step in the instructions should be numbered.
          Each property value should be of type string.`,
      },
    ],
  });

  return Response.json({ recipes: completion.choices[0].message });
}
