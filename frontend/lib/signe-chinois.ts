import { SearchMoonPhase, SearchSunLongitude, Seasons, type AstroTime } from "astronomy-engine";

// LE SIGNE CHINOIS — l'animal et l'élément de l'année de naissance, l'année
// chinoise commençant au Nouvel An lunaire (fin janvier – mi-février), pas
// au 1er janvier : une cliente née le 20 janvier 1990 est encore Serpent.
//
// Le calendrier chinois, compté comme à Pékin (jours à UTC+8) :
//   - un mois commence le jour d'une nouvelle lune ;
//   - le 11e mois est celui qui contient le solstice d'hiver ;
//   - le Nouvel An est le début du 1er mois, deux mois plus tard — trois si
//     l'un des deux mois entre-temps est intercalaire (une année de 13 mois
//     où ce mois ne contient aucun « terme principal », passage du Soleil
//     sur un multiple de 30°).
// Vérifié contre les dates officielles de 1950 à 2034.

const ANIMAUX = ["Rat", "Bœuf", "Tigre", "Lièvre", "Dragon", "Serpent", "Cheval", "Chèvre", "Singe", "Coq", "Chien", "Cochon"] as const;
const ELEMENTS = ["Bois", "Bois", "Feu", "Feu", "Terre", "Terre", "Métal", "Métal", "Eau", "Eau"] as const;
type Animal = (typeof ANIMAUX)[number];

export const EMBLEME: Record<Animal, string> = {
  Rat: "鼠", Bœuf: "牛", Tigre: "虎", Lièvre: "兔", Dragon: "龍", Serpent: "蛇",
  Cheval: "馬", Chèvre: "羊", Singe: "猴", Coq: "雞", Chien: "狗", Cochon: "豬",
};

// Ce que la tradition dit de chacun, en amour — une phrase, douce
export const EN_AMOUR: Record<Animal, string> = {
  Rat: "Vive et attentive, vous aimez avec finesse, et vous protégez ceux que vous aimez.",
  Bœuf: "Fidèle et patiente, vous construisez l'amour comme on bâtit une maison : pour durer.",
  Tigre: "Ardente et entière, vous aimez avec courage, et vous ne trichez pas avec vos sentiments.",
  Lièvre: "Douce et délicate, vous cherchez un amour paisible, où l'on prend soin l'un de l'autre.",
  Dragon: "Lumineuse et généreuse, vous aimez en grand, et vous donnez envie de se dépasser.",
  Serpent: "Profonde et intuitive, vous aimez en silence, et vous devinez ce que l'autre ne dit pas.",
  Cheval: "Libre et passionnée, vous aimez avec élan, à condition de garder de l'air autour de vous.",
  Chèvre: "Tendre et sensible, vous aimez avec le cœur ouvert, et vous embellissez la vie à deux.",
  Singe: "Joueuse et inventive, vous aimez qu'on vous surprenne, et vous savez faire rire l'autre.",
  Coq: "Sincère et loyale, vous aimez avec franchise, et vous mettez du soin dans chaque détail.",
  Chien: "Loyale et protectrice, vous aimez pour toujours, et vous restez quand les autres partent.",
  Cochon: "Généreuse et chaleureuse, vous aimez sans compter, avec une grande tendresse.",
};

export type SigneChinois = { animal: Animal; element: (typeof ELEMENTS)[number]; annee: number; embleme: string; enAmour: string };

/** « AAAA-MM-JJ » du jour, à l'heure de Pékin */
function jourPekin(t: AstroTime): string {
  return new Date(t.date.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Les jours (heure de Pékin) des nouvelles lunes à partir de `debut`, `n` de suite */
function nouvellesLunes(debut: AstroTime, n: number): AstroTime[] {
  const res: AstroTime[] = [];
  let t = debut;
  while (res.length < n) {
    const l = SearchMoonPhase(0, t, 40);
    if (!l) throw new Error("nouvelle lune introuvable");
    res.push(l);
    t = l.AddDays(1);
  }
  return res;
}

/** Les débuts de mois (nouvelles lunes) à partir du 11e mois de l'hiver de `annee` */
function moisDepuisOnzieme(annee: number, n: number): AstroTime[] {
  const solstice = jourPekin(Seasons(annee).dec_solstice);
  const lunes = nouvellesLunes(Seasons(annee).dec_solstice.AddDays(-35), n + 2);
  // Le 11e mois : la dernière nouvelle lune dont le jour est au plus le jour du solstice
  let i = 0;
  while (i + 1 < lunes.length && jourPekin(lunes[i + 1]) <= solstice) i++;
  return lunes.slice(i, i + n);
}

/** Vrai si le mois [debut, fin) contient un terme principal (Soleil sur un multiple de 30°) */
function contientTermePrincipal(debut: AstroTime, fin: AstroTime): boolean {
  const j0 = jourPekin(debut), j1 = jourPekin(fin);
  for (let lon = 0; lon < 360; lon += 30) {
    const t = SearchSunLongitude(lon, debut.AddDays(-1), 40);
    if (t && jourPekin(t) >= j0 && jourPekin(t) < j1) return true;
  }
  return false;
}

const memo = new Map<number, string>();

/** Le jour (« AAAA-MM-JJ », heure de Pékin) du Nouvel An chinois de cette année */
export function nouvelAnChinois(annee: number): string {
  const deja = memo.get(annee);
  if (deja) return deja;
  // Du 11e mois de l'hiver précédent au 11e mois de l'hiver suivant
  const debuts = moisDepuisOnzieme(annee - 1, 15);
  const onziemeSuivant = jourPekin(moisDepuisOnzieme(annee, 1)[0]);
  const nbMois = debuts.findIndex((d) => jourPekin(d) === onziemeSuivant);
  let decalage = 2;
  if (nbMois === 13) {
    // Année de 13 mois : le premier mois sans terme principal est intercalaire
    for (let k = 1; k < 13; k++) {
      if (!contientTermePrincipal(debuts[k], debuts[k + 1])) {
        if (k <= 2) decalage = 3; // intercalaire avant le 1er mois
        break;
      }
    }
  }
  const jour = jourPekin(debuts[decalage]);
  memo.set(annee, jour);
  return jour;
}

export function signeChinois(dateNaissance: string | null | undefined): SigneChinois | null {
  if (!dateNaissance || !/^\d{4}-\d{2}-\d{2}/.test(dateNaissance)) return null;
  const jour = dateNaissance.slice(0, 10);
  let annee = Number(jour.slice(0, 4));
  if (jour < nouvelAnChinois(annee)) annee -= 1;
  const animal = ANIMAUX[(((annee - 4) % 12) + 12) % 12];
  const element = ELEMENTS[(((annee - 4) % 10) + 10) % 10];
  return { animal, element, annee, embleme: EMBLEME[animal], enAmour: EN_AMOUR[animal] };
}
