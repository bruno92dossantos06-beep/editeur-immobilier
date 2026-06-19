"use client";
import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

export default function Home() {
  const [formData, setFormData] = useState({ localisation: '', caracteristiques: '', pointsPrestige: '', styleVie: '', ton: 'Confidentiel et sophistiqué', prix: '', profil: 'Vendeur' });
  const [contactInfo, setContactInfo] = useState({ nom: '', email: '' });
  const [imageFile, setImageFile] = useState(null as File | null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [errors, setErrors] = useState({ nom: '', email: '', prix: '' });
  const [resultat, setResultat] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastTimer = useRef<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    setToastType(type);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(''), 4000);
  };

  const validateForm = () => {
    const nextErrors = { nom: '', email: '', prix: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const prixValue = parseFloat(formData.prix.replace(',', '.'));

    if (!contactInfo.nom.trim()) {
      nextErrors.nom = 'Nom requis.';
    }

    if (!contactInfo.email.trim()) {
      nextErrors.email = 'Email requis.';
    } else if (!emailRegex.test(contactInfo.email)) {
      nextErrors.email = 'Email invalide.';
    }

    if (!formData.prix.trim()) {
      nextErrors.prix = 'Prix requis.';
    } else if (Number.isNaN(prixValue) || prixValue <= 0) {
      nextErrors.prix = 'Entrez un prix valide.';
    }

    setErrors(nextErrors);
    return !nextErrors.nom && !nextErrors.email && !nextErrors.prix;
  };{resultat && (
  <div className="mt-10 p-8 border-2 border-[#BF953F] bg-white shadow-2xl">
    <h2 className="text-2xl font-serif font-bold mb-4 text-[#B38728] uppercase">
      Votre annonce prestige
    </h2>
    <div className="whitespace-pre-line font-serif text-gray-800 text-lg leading-relaxed mb-6">
      {resultat}
    </div>
    
    {/* Bouton de copie */}
    <button 
      onClick={() => {
        navigator.clipboard.writeText(resultat);
        alert("Annonce copiée avec succès !");
      }}
      className="w-full py-3 bg-[#BF953F] text-white font-bold uppercase tracking-widest hover:bg-[#A37B2F] transition-all"
    >
      Copier le texte
    </button>
  </div>
)}

  const handleGenerate = async () => {
    if (!validateForm()) {
      setResultat('Corrigez les erreurs du formulaire.');
      return;
    }
    setLoading(true);
    setResultat('Génération en cours et sauvegarde de votre contact...');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      const generatedText = data.annonce || 'Aucune description générée.';
      setResultat(generatedText);

      if (supabase) {
        let imageUrl = null;

        if (imageFile) {
          const filePath = `${Date.now()}_${imageFile.name}`;
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('annonces')
            .upload(filePath, imageFile);

          if (uploadError) {
            console.error('Erreur Supabase upload :', uploadError);
            showToast('Image non téléchargée, mais l’annonce a été générée.', 'error');
          } else {
            const { data: urlData } = supabase
              .storage
              .from('annonces')
              .getPublicUrl(filePath);

            if (!urlData?.publicUrl) {
              console.error('Erreur Supabase getPublicUrl : URL non générée');
              showToast('Image téléchargée, mais l’URL publique a échoué.', 'error');
            } else {
              imageUrl = urlData.publicUrl;
            }
          }
        }

        const { data: savedData, error } = await supabase.from('prospects').insert([
          {
            "Nom": contactInfo.nom,
            "Email": contactInfo.email,
            "Type Profil": formData.profil,
            "Prix": Number(formData.prix),
            "Description Biens": generatedText,
            "Image_URL": imageUrl,
          },
        ]);

        if (error) {
          console.error('Erreur Supabase :', error);
          showToast('Annonce générée, mais la sauvegarde a échoué.', 'error');
        } else {
          console.log('Prospect sauvegardé :', savedData);
          showToast(
            `Annonce générée et contact sauvegardé : ${contactInfo.nom} (${contactInfo.email}), profil ${formData.profil}, prix ${formData.prix} €`,
            'success'
          );
        }
      } else {
        console.warn('Supabase non initialisé : aucune sauvegarde n’a été effectuée.');
        showToast(
          `Annonce générée pour ${contactInfo.nom} (${contactInfo.email}), profil ${formData.profil}, prix ${formData.prix} €. Supabase non configuré.`,
          'success'
        );
      }
    } catch (error) {
      console.error(error);
      setResultat('Erreur lors de la génération. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-6 lg:p-10 bg-slate-100 min-h-screen text-slate-950">
      <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-10 text-center uppercase tracking-[0.4em] bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-white py-6 px-4 rounded-lg">
        Éditeur Immobilier de Luxe
      </h1>
      {resultat && (
          <div className="mb-8 p-8 border-2 border-[#BF953F] bg-white shadow-2xl">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#B38728] uppercase tracking-widest">
              Votre annonce prestige
            </h2>
            <div className="whitespace-pre-line font-serif text-gray-800 text-lg leading-relaxed mb-6">
              {resultat}
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(resultat);
                alert("Texte copié !");
              }}
              className="w-full py-4 bg-[#BF953F] text-white font-bold uppercase tracking-widest hover:bg-[#A37B2F] transition-all"
            >
              Copier l'annonce
            </button>
          </div>
        )}
      
      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10 min-h-screen">
        <div className="flex flex-col flex-1 min-h-screen gap-0">
          {/* Colonne Gauche : 2 images qui occupent tout l'espace */}
          <div className="flex-1 overflow-hidden rounded-[2rem] shadow-[0_20px_80px_-30px_rgba(15,23,42,0.25)]">
            <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811" alt="Villa" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 overflow-hidden rounded-[2rem] shadow-[0_20px_80px_-30px_rgba(15,23,42,0.25)]">
            <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750" alt="Montre" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-[2] space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.2)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_45px_140px_-60px_rgba(15,23,42,0.22)] lg:p-10">
          {/* Colonne Centrale : Ton Formulaire */}
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-white font-bold px-4 py-2 text-xs uppercase tracking-[0.24em] shadow-sm">
            Édition Premium
          </div>
          <div>
            <label className="block text-sm uppercase tracking-tighter mb-2">Localisation & Environnement</label>
            <input
              className="border-b w-full p-2 outline-none focus:border-black transition"
              placeholder="Ex: Villa perchée sur les hauteurs de Cannes..."
              value={formData.localisation}
              onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-tighter mb-2">Points de Prestige</label>
            <input
              className="border-b w-full p-2 outline-none focus:border-black transition"
              placeholder="Ex: Piscine à débordement, accès plage privé, marbre italien..."
              value={formData.pointsPrestige}
              onChange={(e) => setFormData({ ...formData, pointsPrestige: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-tighter mb-2">Style de Vie</label>
            <input
              className="border-b w-full p-2 outline-none focus:border-black transition"
              placeholder="Ex: Refuge de quiétude, réceptions mondaines..."
              value={formData.styleVie}
              onChange={(e) => setFormData({ ...formData, styleVie: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm uppercase tracking-tighter mb-2">Vos Coordonnées</label>
            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                className="border-b w-full p-2 outline-none focus:border-black transition"
                placeholder="Nom"
                value={contactInfo.nom}
                onChange={(e) => setContactInfo({ ...contactInfo, nom: e.target.value })}
              />
              <input
                className="border-b w-full p-2 outline-none focus:border-black transition"
                placeholder="Email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
              />
            </div>
            <div className="mt-2 space-y-1 text-sm text-red-600">
              {errors.nom ? <p>{errors.nom}</p> : null}
              {errors.email ? <p>{errors.email}</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="w-full">
              <input
                className="border-b w-full p-2 outline-none focus:border-black transition"
                placeholder="Prix estimé (€)"
                value={formData.prix}
                onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
              />
              {errors.prix ? <p className="mt-2 text-sm text-red-600">{errors.prix}</p> : null}
            </div>
            <select
              className="border-b p-2 outline-none focus:border-black transition"
              value={formData.profil}
              onChange={(e) => setFormData({ ...formData, profil: e.target.value })}
            >
              <option value="Vendeur">Vendeur (A un bien)</option>
              <option value="Acheteur">Acheteur (Cherche un bien)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm uppercase tracking-tighter mb-2">Photo de prestige</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (previewUrlRef.current) {
                  URL.revokeObjectURL(previewUrlRef.current);
                }
                if (file) {
                  const url = URL.createObjectURL(file);
                  previewUrlRef.current = url;
                  setPreviewUrl(url);
                } else {
                  previewUrlRef.current = null;
                  setPreviewUrl(null);
                }
                setImageFile(file);
              }}
            />
            {imageFile ? (
              <p className="mt-2 text-sm text-gray-600">Fichier sélectionné : {imageFile.name}</p>
            ) : null}
          </div>

          <button
            className="w-full py-4 uppercase tracking-widest transition disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-white font-bold hover:opacity-95"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Génération en cours...' : 'Générer l’annonce prestige'}
          </button>

          {resultat && (
            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-slate-950 shadow-sm animate-fade-in">
              <h2 className="mb-4 text-xl font-semibold uppercase tracking-[0.24em] text-slate-900">
                Votre annonce prête :
              </h2>
              <div className="whitespace-pre-line leading-7 text-slate-800">
                {resultat}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 min-h-screen gap-0">
          {/* Colonne Droite : 2 images qui occupent tout l'espace */}
          <div className="flex-1 overflow-hidden rounded-[2rem] shadow-[0_20px_80px_-30px_rgba(15,23,42,0.25)]">
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9" alt="Villa" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 overflow-hidden rounded-[2rem] shadow-[0_20px_80px_-30px_rgba(15,23,42,0.25)]">
            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c" alt="Chambre" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </main>
  );
}