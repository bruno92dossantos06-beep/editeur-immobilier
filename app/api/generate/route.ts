import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { localisation, pointsPrestige, styleVie } = body;

    const prompt = `
      Tu es un expert en rédaction immobilière de luxe. 
      Rédige une annonce immobilière exclusive, élégante et persuasive en français.
      
      Données du bien :
      - Localisation : ${localisation}
      - Points de prestige : ${pointsPrestige}
      - Style de vie : ${styleVie}

      Structure l'annonce avec :
      1. Un titre accrocheur.
      2. Une introduction immersive.
      3. Une mise en avant des caractéristiques.
      4. Une conclusion inspirante.
      Utilise un vocabulaire riche et sophistiqué.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    return NextResponse.json({ annonce: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 });
  }
}
