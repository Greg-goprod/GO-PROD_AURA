import { useState } from "react";
import { Music, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Modal, { ModalFooter, ModalButton } from "@/components/ui/Modal";
import SpotifySearchModal from "./SpotifySearchModal";
import { supabase } from "../../../../lib/supabaseClient";

interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images: Array<{ url: string; height: number; width: number }>;
  popularity: number;
  genres: string[];
  followers: { total: number };
}

type Props = {
  companyId: string;
  eventId?: string | null; // ID de l'événement dans lequel l'artiste est créé (pour tracking)
  onClose: () => void;
  onSaved: () => void;
};

export default function AddArtistModal({ companyId, eventId, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const [selectedSpotifyArtist, setSelectedSpotifyArtist] = useState<SpotifyArtist | null>(null);

  const canSave = name.trim().length > 0;

  const handleSpotifySearch = () => {
    if (!name.trim()) {
      setErr("Veuillez d'abord saisir un nom d'artiste");
      return;
    }
    setShowSpotifySearch(true);
  };

  const handleSpotifySelect = (artist: SpotifyArtist) => {
    setSelectedSpotifyArtist(artist);
    setName(artist.name); // Mettre à jour le nom avec celui de Spotify
  };


  const onSubmit = async () => {
    console.log("🚀 Début de l'ajout d'artiste");
    console.log("📝 Données:", { 
      name, 
      companyId, 
      selectedSpotifyArtist: !!selectedSpotifyArtist,
      selectedSpotifyArtistData: selectedSpotifyArtist 
    });
    
    setErr(null);
    if (!canSave) {
      console.log("❌ Validation échouée: nom requis");
      return;
    }
    setLoading(true);

    try {
      // Vérifier et créer la compagnie par défaut si nécessaire
      console.log("🏢 Vérification de la compagnie par défaut...");
      const { data: companyExists, error: companyCheckError } = await supabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .maybeSingle();
      
      if (companyCheckError) {
        console.error("❌ Erreur lors de la vérification de la compagnie:", companyCheckError);
        throw companyCheckError;
      }
      
      if (!companyExists) {
        console.log("🏢 Création de la compagnie par défaut...");
        const { error: companyCreateError } = await supabase
          .from("companies")
          .insert({
            id: companyId,
            name: "Compagnie par défaut",
          });
        
        if (companyCreateError) {
          console.error("❌ Erreur lors de la création de la compagnie:", companyCreateError);
          throw companyCreateError;
        }
        console.log("✅ Compagnie par défaut créée");
      } else {
        console.log("✅ Compagnie existe déjà");
      }

      // Vérifie existence (company_id + name ilike)
      console.log("🔍 Vérification de l'existence de l'artiste...");
      const { data: exists, error: existsErr } = await supabase
        .from("artists")
        .select("id")
        .eq("company_id", companyId)
        .ilike("name", name.trim())
        .maybeSingle();
      
      if (existsErr) {
        console.error("❌ Erreur lors de la vérification d'existence:", existsErr);
        setErr(existsErr.message);
        setLoading(false);
        return;
      }
      
      if (exists?.id) {
        console.log("❌ Artiste déjà existant:", exists.id);
        setErr("Un artiste portant ce nom existe déjà pour cette société.");
        setLoading(false);
        return;
      }

      console.log("✅ Aucun doublon trouvé, insertion de l'artiste...");
      
      // Insérer l'artiste
      const { data: artistData, error: artistErr } = await supabase
        .from("artists")
        .insert([{
          company_id: companyId,
          name: name.trim(),
          status: 'active',
          created_for_event_id: eventId || null // Tracker l'événement d'origine
        }])
        .select('id')
        .single();

      if (artistErr) {
        console.error("❌ Erreur lors de l'insertion de l'artiste:", artistErr);
        throw artistErr;
      }

      console.log("✅ Artiste inséré avec succès:", artistData);

      // Vérification avant insertion Spotify
      console.log("🔍 Vérification des conditions pour Spotify:");
      console.log("🔍 selectedSpotifyArtist:", !!selectedSpotifyArtist);
      console.log("🔍 artistData?.id:", artistData?.id);
      console.log("🔍 selectedSpotifyArtist détails:", selectedSpotifyArtist);

      // Si un artiste Spotify est sélectionné, insérer ses données
      if (selectedSpotifyArtist && artistData?.id) {
        console.log("🎵 Insertion des données Spotify...");
        console.log("🎵 Artiste sélectionné:", selectedSpotifyArtist);
        console.log("🎵 ID de l'artiste:", artistData.id);
        
        const spotifyPayload = {
          artist_id: artistData.id,
          spotify_id: selectedSpotifyArtist.id,
          external_url: selectedSpotifyArtist.external_urls.spotify,
          image_url: selectedSpotifyArtist.images[0]?.url || null,
          popularity: selectedSpotifyArtist.popularity,
          followers: selectedSpotifyArtist.followers.total,
          genres: selectedSpotifyArtist.genres,
          updated_at: new Date().toISOString()
        };

        console.log("📊 Payload Spotify:", spotifyPayload);

        const { data: spotifyData, error: spotifyErr } = await supabase
          .from("spotify_data")
          .insert([spotifyPayload])
          .select();

        if (spotifyErr) {
          console.error("❌ Erreur lors de l'insertion des données Spotify:", spotifyErr);
          setErr(`Erreur Spotify: ${spotifyErr.message}`);
        } else {
          console.log("✅ Données Spotify insérées avec succès:", spotifyData);
        }
      } else {
        console.log("⚠️ Aucun artiste Spotify sélectionné ou ID artiste manquant");
        console.log("⚠️ selectedSpotifyArtist:", !!selectedSpotifyArtist);
        console.log("⚠️ artistData?.id:", artistData?.id);
      }

      console.log("🎉 Ajout d'artiste terminé avec succès");
      setLoading(false);
      onSaved();
    } catch (error) {
      console.error("💥 Erreur lors de l'ajout de l'artiste:", error);
      setErr(error instanceof Error ? error.message : "Erreur lors de l'ajout de l'artiste");
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Ajouter un artiste"
        size="sm"
        draggable={true}
        footer={
          <ModalFooter>
            {err && <div className="text-xs text-red-400 mr-auto">{err}</div>}
            <ModalButton variant="secondary" onClick={onClose}>
              Annuler
            </ModalButton>
            <ModalButton 
              variant="primary" 
              onClick={onSubmit} 
              disabled={!canSave}
              loading={loading}
            >
              Enregistrer
            </ModalButton>
          </ModalFooter>
        }
      >
        <p className="mb-4 text-sm font-sans" style={{color: 'var(--text-secondary)'}}>
          Ajoutez un nouvel artiste à votre base de données. Vous pouvez rechercher sur Spotify pour enrichir automatiquement les données.
        </p>
        
        <div className="space-y-4">
          {/* Champ nom */}
          <div>
            <label className="block text-xs font-medium mb-2 font-sans">Nom de l'artiste *</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nom de l'artiste"
              className="input h-10 text-sm"
            />
          </div>

          {/* Bouton recherche Spotify */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSpotifySearch}
              disabled={!name.trim()}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Rechercher sur Spotify
            </Button>
            
            {selectedSpotifyArtist && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Music className="w-4 h-4" />
                <span>Données Spotify sélectionnées</span>
              </div>
            )}
          </div>

          {/* Informations sur l'artiste sélectionné */}
          {selectedSpotifyArtist && (
            <div className="p-3 rounded-lg border" style={{borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-secondary)'}}>
              <div className="flex items-center gap-3">
                {selectedSpotifyArtist.images[0] && (
                  <img
                    src={selectedSpotifyArtist.images[0].url}
                    alt={selectedSpotifyArtist.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{selectedSpotifyArtist.name}</h4>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedSpotifyArtist.followers.total.toLocaleString()} followers • 
                    Popularité: {selectedSpotifyArtist.popularity}/100
                    {selectedSpotifyArtist.genres.length > 0 && (
                      <span> • {selectedSpotifyArtist.genres[0]}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de recherche Spotify */}
      <SpotifySearchModal
        isOpen={showSpotifySearch}
        onClose={() => setShowSpotifySearch(false)}
        onSelect={handleSpotifySelect}
        searchQuery={name}
      />
    </>
  );
}
