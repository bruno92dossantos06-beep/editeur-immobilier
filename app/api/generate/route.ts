import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

// Cette ligne empêche Vercel de tenter de pré-générer cette route au build
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Initialisation du client OpenAI à l'intérieur de la fonction
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await req.json();
    const { localisation, pointsPrestige, styleVie } = body;

    const prompt = `
      Tu es un expert en rédaction immobilière de luxe.
      Rédige une annonce immobilière exclusive, élégante et persuasive.

      Données du bien :
      - Localisation : ${localisation}
      - Points de prestige : ${pointsPrestige}
      - Style de vie : ${styleVie}

      Structure l'annonce avec :
      - Un titre accrocheur
      - Une description immersive
      - Un appel à l'action final
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ 
      annonce: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error("Erreur API :", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'annonce" }, 
      { status: 500 }
    );
  }
}