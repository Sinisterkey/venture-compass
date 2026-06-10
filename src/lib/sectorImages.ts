import education from "@/assets/sectors/education.jpg";
import health from "@/assets/sectors/health.jpg";
import water from "@/assets/sectors/water.jpg";
import agriculture from "@/assets/sectors/agriculture.jpg";
import youth from "@/assets/sectors/youth.jpg";
import refugees from "@/assets/sectors/refugees.jpg";
import community from "@/assets/sectors/community.jpg";
import partnership from "@/assets/sectors/partnership.jpg";

/** Returns a real photo matching an organization's sector. */
export function sectorImage(sector?: string | null): string {
  const s = (sector || "").toLowerCase();
  if (s.includes("educat") || s.includes("stem") || s.includes("school")) return education;
  if (s.includes("health") || s.includes("medic") || s.includes("matern")) return health;
  if (s.includes("water") || s.includes("sanit")) return water;
  if (s.includes("agri") || s.includes("food") || s.includes("farm")) return agriculture;
  if (s.includes("youth") || s.includes("entrepreneur") || s.includes("employ") || s.includes("skill")) return youth;
  if (s.includes("refugee") || s.includes("migra") || s.includes("displace")) return refugees;
  return community;
}

/** Rotating set of photos for funder cards. */
const funderImages = [partnership, community, education, agriculture];
export function funderImage(index: number): string {
  return funderImages[index % funderImages.length];
}
