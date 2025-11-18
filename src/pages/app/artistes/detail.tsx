import { User, ArrowLeft, Music, TrendingUp, Calendar, Mail, Phone, MapPin, Briefcase, Globe } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { ArtistStatsChart } from "../../../components/artists/ArtistStatsChart";
import { ContainerSongstats } from "../../../components/artist/ContainerSongstats";
import { getCurrentCompanyId } from "../../../lib/tenant";
import { formatPhoneNumber, getWhatsAppLink } from "../../../utils/phoneUtils";
import type { CRMContact, CRMArtistContactLink } from "../../../types/crm";

type Artist = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  email?: string;
  phone?: string;
  location?: string;
  spotify_data?: {
    image_url?: string;
    followers?: number;
    popularity?: number;
    external_url?: string;
    genres?: string[];
  };
  social_media_data?: {
    instagram_url?: string;
    facebook_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
    twitter_url?: string;
    website_url?: string;
    threads_url?: string;
    soundcloud_url?: string;
    bandcamp_url?: string;
    wikipedia_url?: string;
  };
};

type ArtistContact = CRMContact & {
  link: CRMArtistContactLink;
  roles?: Array<{
    id: string;
    label: string;
  }>;
};

export default function ArtistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [contacts, setContacts] = useState<ArtistContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchArtist();
    fetchArtistContacts();
  }, [id]);

  const fetchArtist = async () => {
    try {
      setLoading(true);
      
      // Récupérer le company_id
      const cid = await getCurrentCompanyId(supabase);
      setCompanyId(cid);
      
      const { data, error: err } = await supabase
        .from("artists")
        .select("*, spotify_data(*), social_media_data(*)")
        .eq("id", id)
        .single();

      if (err) throw err;
      
      // Normaliser les données si ce sont des tableaux
      if (data) {
        // Normaliser spotify_data
        if (Array.isArray(data.spotify_data)) {
          data.spotify_data = data.spotify_data.length > 0 ? data.spotify_data[0] : null;
        }
        
        // Normaliser social_media_data
        if (Array.isArray(data.social_media_data)) {
          data.social_media_data = data.social_media_data.length > 0 ? data.social_media_data[0] : null;
        }
      }
      
      setArtist(data);
    } catch (err: any) {
      console.error('Error fetching artist:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistContacts = async () => {
    try {
      const cid = await getCurrentCompanyId(supabase);
      
      // Récupérer les liens artiste-contact avec les contacts
      const { data: linksData, error: err } = await supabase
        .from("crm_artist_contact_links")
        .select(`
          id,
          company_id,
          artist_id,
          contact_id,
          role_for_artist,
          territory,
          is_main_agent,
          notes,
          crm_contacts (
            id,
            first_name,
            last_name,
            display_name,
            photo_url,
            email_primary,
            phone_mobile,
            phone_whatsapp,
            department_id
          )
        `)
        .eq("company_id", cid)
        .eq("artist_id", id);

      if (err) {
        console.error('Error fetching artist contacts:', err);
        throw err;
      }

      if (!linksData || linksData.length === 0) {
        setContacts([]);
        return;
      }

      // Récupérer les rôles pour tous les contacts
      const contactIds = linksData.map((item: any) => item.crm_contacts?.id).filter((id: any) => id != null);
      
      let rolesMap: { [key: string]: any[] } = {};
      
      if (contactIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("crm_contact_role_links")
          .select(`
            contact_id,
            role:contact_roles(id, label)
          `)
          .in("contact_id", contactIds);
          
        if (rolesData) {
          rolesData.forEach((link: any) => {
            if (!rolesMap[link.contact_id]) {
              rolesMap[link.contact_id] = [];
            }
            if (link.role) {
              rolesMap[link.contact_id].push(link.role);
            }
          });
        }
      }

      // Transformer les données
      const artistContacts: ArtistContact[] = linksData.map((item: any) => {
        return {
          ...item.crm_contacts,
          roles: rolesMap[item.crm_contacts?.id] || [],
          link: {
            id: item.id,
            company_id: item.company_id,
            artist_id: item.artist_id,
            contact_id: item.contact_id,
            role_for_artist: item.role_for_artist,
            territory: item.territory,
            is_main_agent: item.is_main_agent,
            notes: item.notes,
            created_by: item.created_by,
            created_at: item.created_at,
            updated_at: item.updated_at,
          },
        };
      });

      // Trier pour mettre les booking agents en premier
      artistContacts.sort((a, b) => {
        // Vérifier si le contact a le rôle "Booking Agent" (insensible à la casse)
        const aIsBookingAgent = a.roles?.some(role => 
          role.label.toLowerCase().includes('booking') || role.label.toLowerCase().includes('agent')
        );
        const bIsBookingAgent = b.roles?.some(role => 
          role.label.toLowerCase().includes('booking') || role.label.toLowerCase().includes('agent')
        );

        // 1. Les booking agents avant les autres
        if (aIsBookingAgent && !bIsBookingAgent) return -1;
        if (!aIsBookingAgent && bIsBookingAgent) return 1;

        // 2. Parmi les booking agents, le main agent en premier
        if (aIsBookingAgent && bIsBookingAgent) {
          if (a.link.is_main_agent && !b.link.is_main_agent) return -1;
          if (!a.link.is_main_agent && b.link.is_main_agent) return 1;
        }

        return 0;
      });

      setContacts(artistContacts);
    } catch (err: any) {
      console.error('Error fetching artist contacts:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400"></div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-6">
        <div className="card-surface p-12 rounded-xl text-center border border-red-500/20 bg-red-500/10">
          <Music className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {error || "Artiste non trouvé"}
          </p>
          <button onClick={() => navigate('/app/artistes')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary w-10 h-10 p-0 flex items-center justify-center"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white uppercase">
              {artist.name}
            </h1>
          </div>
        </div>
        <button className="btn btn-primary">
          Modifier
        </button>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card - Photo en pleine largeur */}
          <div className="card-surface rounded-xl overflow-hidden">
            <div className="h-80 w-full bg-gradient-to-br from-violet-400 to-violet-600">
              {artist.spotify_data?.image_url ? (
                <img
                  src={artist.spotify_data.image_url}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            <div className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 uppercase">
                {artist.name}
              </h2>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Calendar size={14} />
                Ajouté le {new Date(artist.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Widget Spotify Officiel */}
          {artist.spotify_data?.external_url && (
            <div className="card-surface p-4 rounded-xl">
              {/* Widget Spotify Embed */}
              <div className="w-full">
                <iframe
                  src={`https://open.spotify.com/embed/artist/${artist.spotify_data.external_url.split('/').pop()}?utm_source=generator&theme=0`}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Card - Contacts CRM */}
          <div className="card-surface p-6 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Contacts</h3>
            {contacts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {contacts.map((contact) => (
                      <tr 
                        key={contact.id}
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        {/* 1. Fonction */}
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap items-center gap-1">
                            {contact.link.is_main_agent && (
                              <span className="text-violet-400">⭐</span>
                            )}
                            {contact.roles && contact.roles.length > 0 ? (
                              contact.roles.map((role) => (
                                <span key={role.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200">
                                  {role.label}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                            {contact.link.territory && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {contact.link.territory}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Nom Prénom */}
                        <td className="py-3 pr-4">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">
                            {contact.display_name || `${contact.first_name} ${contact.last_name}`}
                          </div>
                        </td>

                        {/* 3. Téléphone (WhatsApp) */}
                        <td className="py-3 pr-4">
                          {contact.phone_mobile ? (
                            <a 
                              href={getWhatsAppLink(contact.phone_mobile) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Phone size={14} />
                              {formatPhoneNumber(contact.phone_mobile)}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>

                        {/* 4. Mail */}
                        <td className="py-3">
                          {contact.email_primary ? (
                            <a 
                              href={`mailto:${contact.email_primary}`}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-1.5"
                            >
                              <Mail size={14} />
                              {contact.email_primary}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun contact associé</p>
            )}
          </div>
          {/* Spotify Stats */}
          {artist.spotify_data && (
            <div className="card-surface p-6 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Statistiques Spotify</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="card-surface p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-violet-400" />
                    <span className="text-xs text-gray-400 uppercase">Followers</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {artist.spotify_data.followers?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="card-surface p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-violet-400" />
                    <span className="text-xs text-gray-400 uppercase">Popularité</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {artist.spotify_data.popularity || 'N/A'}
                  </p>
                </div>
              </div>
              {artist.spotify_data.genres && artist.spotify_data.genres.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {artist.spotify_data.genres.map((genre, index) => (
                      <span key={index} className="badge">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Graphique d'évolution Spotify */}
          <div className="card-surface p-6 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Évolution Spotify</h3>
            <ArtistStatsChart artistId={artist.id} artistName={artist.name} />
          </div>

          {/* Social Media Links */}
          <div className="card-surface p-6 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Réseaux sociaux</h3>
            <div className="flex flex-wrap gap-4">
              {/* Spotify */}
              {artist.spotify_data?.external_url ? (
                <a
                  href={artist.spotify_data.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Spotify"
                >
                  <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.44-.494.15-1.017-.122-1.167-.616-.15-.494.122-1.017.616-1.167 4.239-1.26 9.6-.66 13.2 1.68.479.3.578 1.02.262 1.5zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.719-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Spotify (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.44-.494.15-1.017-.122-1.167-.616-.15-.494.122-1.017.616-1.167 4.239-1.26 9.6-.66 13.2 1.68.479.3.578 1.02.262 1.5zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.719-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
              )}

              {/* Instagram */}
              {artist.social_media_data?.instagram_url ? (
                <a
                  href={artist.social_media_data.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Instagram"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Instagram (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
              )}

              {/* Facebook */}
              {artist.social_media_data?.facebook_url ? (
                <a
                  href={artist.social_media_data.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Facebook"
                >
                  <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Facebook (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
              )}

              {/* Twitter/X */}
              {artist.social_media_data?.twitter_url ? (
                <a
                  href={artist.social_media_data.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Twitter / X"
                >
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Twitter / X (non disponible)">
                  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              )}

              {/* YouTube */}
              {artist.social_media_data?.youtube_url ? (
                <a
                  href={artist.social_media_data.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="YouTube"
                >
                  <div className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="YouTube (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              )}

              {/* TikTok */}
              {artist.social_media_data?.tiktok_url ? (
                <a
                  href={artist.social_media_data.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="TikTok"
                >
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path fill="#25F4EE" d="M9.37,23.5a7.468,7.468,0,0,1,0-14.936.537.537,0,0,1,.538.5v3.8a.542.542,0,0,1-.5.5,2.671,2.671,0,1,0,2.645,2.669.432.432,0,0,1,0-.05V1a.5.5,0,0,1,.5-.5h3.787a.5.5,0,0,1,.5.5,4.759,4.759,0,0,0,4.759,4.759.5.5,0,0,1,.5.5v3.759a.5.5,0,0,1-.5.5A8.073,8.073,0,0,1,17.5,9.6a.51.51,0,0,0-.5.5v6.049a7.468,7.468,0,0,1-7.633,7.346Z"/>
                      <path fill="#FE2C55" d="M23.5,9.5a.5.5,0,0,1-.5-.5A4.759,4.759,0,0,1,18.241,4.5a.5.5,0,0,1-.5-.5H13.956a.5.5,0,0,1-.5.5v15.66a2.671,2.671,0,1,1-2.645-2.669.542.542,0,0,1,.5-.5v-3.8a.537.537,0,0,0-.538-.5,7.468,7.468,0,0,0,0,14.936A7.468,7.468,0,0,0,17.867,20.5V14.451a.51.51,0,0,1,.5-.5,8.073,8.073,0,0,0,4.609.917.5.5,0,0,0,.5-.5Z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="TikTok (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
              )}

              {/* Website */}
              {artist.social_media_data?.website_url ? (
                <a
                  href={artist.social_media_data.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Site Web"
                >
                  <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Site Web (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
              )}

              {/* Threads */}
              {artist.social_media_data?.threads_url ? (
                <a
                  href={artist.social_media_data.threads_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Threads"
                >
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 013.02.142c-.126-.742-.375-1.332-.74-1.755-.513-.592-1.314-.9-2.447-.943-1.342.025-2.453.563-3.205 1.555l-1.462-1.16c1.08-1.345 2.69-2.057 4.647-2.057 1.65.02 2.986.58 3.965 1.663.938 1.037 1.453 2.51 1.533 4.388.146 3.49-1.84 5.772-4.923 6.02-1.11.09-2.175-.183-2.985-.814-.733-.57-1.1-1.335-1.05-2.175.037-.625.337-1.182.88-1.635.458-.382 1.044-.616 1.683-.67a8.363 8.363 0 012.048.074c-.133-.743-.378-1.33-.731-1.745-.497-.582-1.27-.888-2.298-.908-1.304.025-2.374.562-3.084 1.548l-1.455-1.155c1.044-1.333 2.598-2.03 4.496-2.03 1.603.02 2.893.573 3.83 1.643.903 1.033 1.394 2.497 1.463 4.354.137 3.447-1.787 5.69-4.768 5.934-1.08.088-2.104-.18-2.877-.802-.701-.564-1.05-1.318-.993-2.143.042-.613.325-1.158.83-1.599.424-.371.968-.6 1.567-.652z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Threads (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 013.02.142c-.126-.742-.375-1.332-.74-1.755-.513-.592-1.314-.9-2.447-.943-1.342.025-2.453.563-3.205 1.555l-1.462-1.16c1.08-1.345 2.69-2.057 4.647-2.057 1.65.02 2.986.58 3.965 1.663.938 1.037 1.453 2.51 1.533 4.388.146 3.49-1.84 5.772-4.923 6.02-1.11.09-2.175-.183-2.985-.814-.733-.57-1.1-1.335-1.05-2.175.037-.625.337-1.182.88-1.635.458-.382 1.044-.616 1.683-.67a8.363 8.363 0 012.048.074c-.133-.743-.378-1.33-.731-1.745-.497-.582-1.27-.888-2.298-.908-1.304.025-2.374.562-3.084 1.548l-1.455-1.155c1.044-1.333 2.598-2.03 4.496-2.03 1.603.02 2.893.573 3.83 1.643.903 1.033 1.394 2.497 1.463 4.354.137 3.447-1.787 5.69-4.768 5.934-1.08.088-2.104-.18-2.877-.802-.701-.564-1.05-1.318-.993-2.143.042-.613.325-1.158.83-1.599.424-.371.968-.6 1.567-.652z"/>
                  </svg>
                </div>
              )}

              {/* SoundCloud */}
              {artist.social_media_data?.soundcloud_url ? (
                <a
                  href={artist.social_media_data.soundcloud_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="SoundCloud"
                >
                  <div className="w-10 h-10 bg-[#FF5500] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.04 0-.078.037-.083.077l-.222 1.326.222 1.28c.005.04.042.077.083.077s.078-.037.083-.077l.249-1.28-.249-1.326c-.005-.04-.042-.077-.083-.077m1.8-1.024c-.061 0-.11.05-.117.111l-.209 2.179.209 2.098c.008.06.056.111.116.111.061 0 .11-.05.117-.111l.235-2.098-.235-2.179c-.007-.06-.056-.111-.116-.111m.9-.355c-.068 0-.125.058-.133.127l-.189 2.534.189 2.445c.008.07.065.127.133.127.068 0 .125-.058.132-.127l.211-2.445-.211-2.534c-.007-.07-.064-.127-.132-.127m.899-.498c-.076 0-.138.065-.145.142l-.178 3.032.178 2.898c.007.077.069.142.145.142.076 0 .139-.065.145-.142l.201-2.898-.201-3.032c-.006-.077-.069-.142-.145-.142m.899-.611c-.083 0-.152.073-.159.158l-.17 3.643.17 2.957c.007.085.076.158.159.158.084 0 .152-.073.159-.158l.19-2.957-.19-3.643c-.007-.085-.075-.158-.159-.158m.908-.668c-.091 0-.166.08-.174.173l-.16 4.311.16 3.022c.008.093.083.173.173.173.091 0 .166-.08.173-.173l.19-3.022-.19-4.311c-.007-.093-.082-.173-.173-.173m.908-.779c-.1 0-.182.087-.189.191l-.148 5.09.148 2.983c.007.104.089.191.189.191.1 0 .182-.087.189-.191l.17-2.983-.17-5.09c-.007-.104-.089-.191-.189-.191m.908-1.085c-.107 0-.197.093-.204.201l-.138 6.175.138 2.925c.007.109.097.202.204.202.107 0 .196-.093.203-.202l.159-2.925-.159-6.175c-.007-.108-.096-.201-.203-.201m.917-.223c-.116 0-.21.101-.218.219l-.128 6.398.128 2.879c.008.117.102.218.218.218.115 0 .21-.101.217-.218l.146-2.879-.146-6.398c-.007-.118-.102-.219-.217-.219m.908-.448c-.123 0-.223.107-.231.236l-.121 6.846.121 2.853c.008.129.108.236.231.236.123 0 .223-.107.231-.236l.139-2.853-.139-6.846c-.008-.129-.108-.236-.231-.236m.917-.62c-.13 0-.237.114-.244.251l-.111 7.466.111 2.813c.007.136.114.25.244.25.13 0 .237-.114.244-.25l.129-2.813-.129-7.466c-.007-.137-.114-.251-.244-.251m.908-.734c-.138 0-.25.122-.258.269l-.104 8.2.104 2.771c.008.147.12.269.258.269.138 0 .25-.122.258-.269l.115-2.771-.115-8.2c-.008-.147-.12-.269-.258-.269m.917-.846c-.145 0-.263.129-.271.284l-.096 9.046.096 2.734c.008.156.126.284.271.284.145 0 .263-.128.271-.284l.108-2.734-.108-9.046c-.008-.155-.126-.284-.271-.284m.908-.945c-.153 0-.277.136-.286.301l-.088 9.991.088 2.694c.009.165.133.301.286.301.153 0 .277-.136.285-.301l.099-2.694-.099-9.991c-.008-.165-.132-.301-.285-.301m.917-1.062c-.161 0-.291.142-.299.317l-.081 11.053.081 2.657c.008.175.138.316.299.316.161 0 .291-.141.299-.316l.089-2.657-.089-11.053c-.008-.175-.138-.317-.299-.317m.908-1.166c-.168 0-.304.149-.312.331l-.073 12.219.073 2.621c.008.182.144.331.312.331.168 0 .304-.149.312-.331l.08-2.621-.08-12.219c-.008-.182-.144-.331-.312-.331m.917-1.266c-.176 0-.318.156-.327.345l-.065 13.485.065 2.586c.009.189.151.345.327.345.176 0 .318-.156.326-.345l.071-2.586-.071-13.485c-.008-.189-.15-.345-.326-.345m.908-1.359c-.184 0-.332.163-.34.36l-.058 14.844.058 2.553c.008.197.156.36.34.36.184 0 .332-.163.34-.36l.064-2.553-.064-14.844c-.008-.197-.156-.36-.34-.36"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="SoundCloud (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.04 0-.078.037-.083.077l-.222 1.326.222 1.28c.005.04.042.077.083.077s.078-.037.083-.077l.249-1.28-.249-1.326c-.005-.04-.042-.077-.083-.077m1.8-1.024c-.061 0-.11.05-.117.111l-.209 2.179.209 2.098c.008.06.056.111.116.111.061 0 .11-.05.117-.111l.235-2.098-.235-2.179c-.007-.06-.056-.111-.116-.111m.9-.355c-.068 0-.125.058-.133.127l-.189 2.534.189 2.445c.008.07.065.127.133.127.068 0 .125-.058.132-.127l.211-2.445-.211-2.534c-.007-.07-.064-.127-.132-.127m.899-.498c-.076 0-.138.065-.145.142l-.178 3.032.178 2.898c.007.077.069.142.145.142.076 0 .139-.065.145-.142l.201-2.898-.201-3.032c-.006-.077-.069-.142-.145-.142m.899-.611c-.083 0-.152.073-.159.158l-.17 3.643.17 2.957c.007.085.076.158.159.158.084 0 .152-.073.159-.158l.19-2.957-.19-3.643c-.007-.085-.075-.158-.159-.158m.908-.668c-.091 0-.166.08-.174.173l-.16 4.311.16 3.022c.008.093.083.173.173.173.091 0 .166-.08.173-.173l.19-3.022-.19-4.311c-.007-.093-.082-.173-.173-.173m.908-.779c-.1 0-.182.087-.189.191l-.148 5.09.148 2.983c.007.104.089.191.189.191.1 0 .182-.087.189-.191l.17-2.983-.17-5.09c-.007-.104-.089-.191-.189-.191m.908-1.085c-.107 0-.197.093-.204.201l-.138 6.175.138 2.925c.007.109.097.202.204.202.107 0 .196-.093.203-.202l.159-2.925-.159-6.175c-.007-.108-.096-.201-.203-.201m.917-.223c-.116 0-.21.101-.218.219l-.128 6.398.128 2.879c.008.117.102.218.218.218.115 0 .21-.101.217-.218l.146-2.879-.146-6.398c-.007-.118-.102-.219-.217-.219m.908-.448c-.123 0-.223.107-.231.236l-.121 6.846.121 2.853c.008.129.108.236.231.236.123 0 .223-.107.231-.236l.139-2.853-.139-6.846c-.008-.129-.108-.236-.231-.236m.917-.62c-.13 0-.237.114-.244.251l-.111 7.466.111 2.813c.007.136.114.25.244.25.13 0 .237-.114.244-.25l.129-2.813-.129-7.466c-.007-.137-.114-.251-.244-.251m.908-.734c-.138 0-.25.122-.258.269l-.104 8.2.104 2.771c.008.147.12.269.258.269.138 0 .25-.122.258-.269l.115-2.771-.115-8.2c-.008-.147-.12-.269-.258-.269m.917-.846c-.145 0-.263.129-.271.284l-.096 9.046.096 2.734c.008.156.126.284.271.284.145 0 .263-.128.271-.284l.108-2.734-.108-9.046c-.008-.155-.126-.284-.271-.284m.908-.945c-.153 0-.277.136-.286.301l-.088 9.991.088 2.694c.009.165.133.301.286.301.153 0 .277-.136.285-.301l.099-2.694-.099-9.991c-.008-.165-.132-.301-.285-.301m.917-1.062c-.161 0-.291.142-.299.317l-.081 11.053.081 2.657c.008.175.138.316.299.316.161 0 .291-.141.299-.316l.089-2.657-.089-11.053c-.008-.175-.138-.317-.299-.317m.908-1.166c-.168 0-.304.149-.312.331l-.073 12.219.073 2.621c.008.182.144.331.312.331.168 0 .304-.149.312-.331l.08-2.621-.08-12.219c-.008-.182-.144-.331-.312-.331m.917-1.266c-.176 0-.318.156-.327.345l-.065 13.485.065 2.586c.009.189.151.345.327.345.176 0 .318-.156.326-.345l.071-2.586-.071-13.485c-.008-.189-.15-.345-.326-.345m.908-1.359c-.184 0-.332.163-.34.36l-.058 14.844.058 2.553c.008.197.156.36.34.36.184 0 .332-.163.34-.36l.064-2.553-.064-14.844c-.008-.197-.156-.36-.34-.36"/>
                  </svg>
                </div>
              )}

              {/* Bandcamp */}
              {artist.social_media_data?.bandcamp_url ? (
                <a
                  href={artist.social_media_data.bandcamp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Bandcamp"
                >
                  <div className="w-10 h-10 bg-[#629AA9] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Bandcamp (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
                  </svg>
                </div>
              )}

              {/* Wikipedia */}
              {artist.social_media_data?.wikipedia_url ? (
                <a
                  href={artist.social_media_data.wikipedia_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all hover:scale-110"
                  title="Wikipedia"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path fill="#000" d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127 1.463-1.618 1.463-.369 0-.616-.194-.616-.583 0-.721.853-2.315 1.234-3.315l-1.234-.371c-.483 1.309-1.616 4.327-1.616 5.112 0 .784.616 1.309 1.47 1.309 1.002 0 1.746-.434 2.491-1.698.744-1.263 1.744-3.315 2.725-5.727.98-2.413 1.635-3.315 2.853-3.315.369 0 .616.194.616.583 0 .721-.853 2.315-1.234 3.315l1.234.371c.483-1.309 1.616-4.327 1.616-5.112 0-.784-.616-1.309-1.47-1.309-1.002 0-1.746.434-2.491 1.698z"/>
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center opacity-50" title="Wikipedia (non disponible)">
                  <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127 1.463-1.618 1.463-.369 0-.616-.194-.616-.583 0-.721.853-2.315 1.234-3.315l-1.234-.371c-.483 1.309-1.616 4.327-1.616 5.112 0 .784.616 1.309 1.47 1.309 1.002 0 1.746-.434 2.491-1.698.744-1.263 1.744-3.315 2.725-5.727.98-2.413 1.635-3.315 2.853-3.315.369 0 .616.194.616.583 0 .721-.853 2.315-1.234 3.315l1.234.371c.483-1.309 1.616-4.327 1.616-5.112 0-.784-.616-1.309-1.47-1.309-1.002 0-1.746.434-2.491 1.698z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Songstats Container */}
          {companyId && id && (
            <ContainerSongstats companyId={companyId} artistId={id} />
          )}

          {/* Additional Info Placeholder */}
          <div className="card-surface p-6 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Informations supplémentaires</h3>
            <p className="text-sm text-gray-400 italic">
              {/* TODO: Ajouter biographie, historique des bookings, documents, etc. */}
              Section à implémenter : biographie, historique des bookings, documents contractuels...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

