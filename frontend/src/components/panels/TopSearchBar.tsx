import { useEffect, useState } from "react";
import { useMapContext } from "../../context/MapContext";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";

interface Suggestion {
  description: string;
  placeId: string;
}

export const TopSearchBar = () => {
  const {
    destination,
    setDestination,
    setSearchSuggestions,
  } = useMapContext();
  const { socket } = useSocket();
  const { room } = useRoom();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch autocomplete suggestions from Google Places.
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearchSuggestions([]);
      return;
    }

    if (!window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.AutocompleteService();
    setLoading(true);

    // Search for all types of places: geocode, establishment (restaurants, shops, etc), regions, cities
    autocomplete.getPlacePredictions(
      {
        input: query,
        // Remove type restrictions to get all suggestions
        types: [], // Empty array means all types
      },
      (results: google.maps.places.AutocompletePrediction[] | null) => {
        setLoading(false);
        if (!results) {
          setSuggestions([]);
          setSearchSuggestions([]);
          return;
        }
        const sug = results.map((r: google.maps.places.AutocompletePrediction) => ({
          description: r.description,
          placeId: r.place_id!,
        }));
        setSuggestions(sug);
        setSearchSuggestions(sug);
      }
    );
  }, [query, setSearchSuggestions]);

  const goToPlace = (suggestion: Suggestion) => {
    if (!window.google?.maps?.places) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.getDetails(
      {
        placeId: suggestion.placeId,
        fields: ["geometry", "formatted_address"],
      },
      (
        place: google.maps.places.PlaceResult | null,
        status: google.maps.places.PlacesServiceStatus
      ) => {
        if (
          status !== window.google!.maps.places.PlacesServiceStatus.OK ||
          !place?.geometry?.location
        ) {
          return;
        }

        const loc = place.geometry.location;
        const dest = {
          lat: loc.lat(),
          lng: loc.lng(),
          description: place.formatted_address || suggestion.description,
        };
        setDestination(dest);
        if (socket && room?._id) {
          socket.emit("trip:destination", {
            roomId: room._id,
            destination: dest,
          });
        }
        setSuggestions([]);
        setSearchSuggestions([]);
        setQuery("");
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const first = suggestions[0];
    if (first) {
      goToPlace(first);
    }
  };

  if (!destination && room?.activeTrip) return null;

  // Hide search bar on mobile when trip is active
  const isTripActive = room?.activeTrip;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-4 z-20 flex justify-center px-4 md:px-6">
      {isTripActive ? (
        // Show reference to sidebar on mobile when trip is active
        <div className="pointer-events-auto md:hidden w-full max-w-2xl pr-14">
          <div className="flex items-center justify-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-6 py-3 shadow-2xl backdrop-blur-xl">
            <span className="text-xs text-indigo-300 font-medium">
              Use the sidebar menu to manage your trip
            </span>
            <span className="text-indigo-400">☰</span>
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto w-full max-w-2xl pr-14 md:pr-0">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-black/70 px-6 py-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="text-neutral-500 mr-1">🔍</div>
            <input
              className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
              placeholder="Search destination or place..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && (
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "…" : "Search"}
              </button>
            )}
          </form>

          {suggestions.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-3xl border border-white/10 bg-black/90 p-2 text-sm text-neutral-100 shadow-2xl backdrop-blur-xl">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  className="block w-full rounded-xl px-4 py-3 text-left transition-all hover:bg-white/10"
                  onClick={() => goToPlace(s)}
                >
                  {s.description}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

