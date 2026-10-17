/*
  Where the kitchen is — the two facts the header and the "Visit us" block show.

  NOT copy, so not in the i18n dictionaries: a translator must never be handed a
  URL to translate, and the street address is the same string in every language
  (it is what a driver types into a map). The locality reads "Rawai, Phuket" in
  Latin everywhere for the same reason.

  AUTHORITY is the canonical NAP in `scripts/aeo-prerender.mjs` — sourced from
  00_Legal (the Tabian Baan plus the Tops Daily Soi Naya 2 lease), not from a
  directory listing, and L2 only: the Saiyuan prep kitchen must never be
  published as a customer address. If one moves, move both.

  The map link is a SEARCH by business name, not a pin. We have no verified
  lat/long, and the prerender script refuses to invent coordinates for a
  machine-readable record; the same rule applies to a link that claims to be our
  front door.
*/

export const VENUE = {
  street: "31/33 Moo 1, Tops Daily Soi Naya 2, Unit R01",
  locality: "Rawai, Phuket",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=SHiSHKA+Healthy+Kitchen+Rawai+Phuket",
  instagram: "https://www.instagram.com/shishka_healthy_kitchen",
};
